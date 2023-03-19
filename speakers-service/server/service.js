const express = require('express');

const service = express();

const Speakers = require('./lib/Speakers');

module.exports = (config) => {
  const log = config.log();

  const speakers = new Speakers(config.data.speakers);

  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`);
      return next();
    });
  }

  service.use('/images/', express.static(config.data.images));

  service.get('/list', async (request, response, next) => {
    try {
      return response.json(await speakers.getList());
    } catch (err) {
      return next(err);
    }
  });

  service.get('/list-short', async (request, response, next) => {
    try {
      return response.json(await speakers.getListShort());
    } catch (err) {
      return next(err);
    }
  });

  service.get('/names', async (request, response, next) => {
    try {
      return response.json(await speakers.getNames());
    } catch (err) {
      return next(err);
    }
  });

  service.get('/artwork', async (req, res, next) => {
    try {
      return res.json(await speakers.getAllArtwork());
    } catch (err) {
      return next(err);
    }
  });

  service.get('/speaker/:shortname', async (request, response, next) => {
    try {
      const { shortname } = request.params;
      const speaker = await speakers.getSpeaker(shortname);
      return response.json(speaker);
    } catch (err) {
      return next(err);
    }
  });

  service.get('/artwork/:shortname', async (request, response, next) => {
    try {
      const { shortname } = request.params;
      const speaker = await speakers.getArtworkForSpeaker(shortname);
      return response.json(speaker);
    } catch (err) {
      return next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500);
    // Log out the error to the console
    log.error(error);
    return res.json({
      error: {
        message: error.message,
      },
    });
  });
  return service;
};
