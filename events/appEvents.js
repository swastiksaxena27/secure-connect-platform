const EventEmitter = require('events');

class AppEvents extends EventEmitter {}

// one shared instance, used by controllers (emit) and listeners (on)
module.exports = new AppEvents();