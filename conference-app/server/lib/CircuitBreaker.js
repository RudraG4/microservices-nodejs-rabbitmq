const axios = require('axios');

class CircuitBreaker {
  constructor() {
    this.states = {};
    this.failureThreshold = 5;
    this.coolingPeriod = 10;
    this.requestTimeout = 2;
  }

  initState(endpoint) {
    this.states[endpoint] = {
      circuit: 'CLOSED',
      failures: 0,
      cooldownperiod: this.coolingPeriod,
      nextTry: 0,
    };
  }

  onSuccess(endpoint) {
    this.initState(endpoint);
  }

  onFailure(endpoint) {
    const state = this.states[endpoint];
    state.failures += 1;
    if (state.failures > this.failureThreshold) {
      state.circuit = 'OPEN';
      state.nextTry = new Date() / 1000 + this.coolingPeriod;
      console.log(`Alert! Circuit is broken for endpoint ${endpoint}`);
    }
  }

  canRequest(endpoint) {
    if (!this.states[endpoint]) this.initState(endpoint);
    const state = this.states[endpoint];
    if (state.circuit === 'CLOSED') return true;

    const now = new Date() / 1000;

    if (state.nextTry <= now) {
      state.circuit = 'HALF';
      console.log(`Alert! Circuit is HALF OPEN for endpoint ${endpoint}`);
      return true;
    }
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  async callService(request) {
    const endpoint = `${request.method}:${request.url}`;

    if (!this.canRequest(endpoint)) return false;

    request.timeout = this.requestTimeout * 1000;
    try {
      const response = await axios(request);
      this.onSuccess(endpoint);
      return response.data;
    } catch (err) {
      this.onFailure(endpoint);
      return false;
    }
  }
}

module.exports = CircuitBreaker;
