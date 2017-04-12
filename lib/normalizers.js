'use strict';

var _ = require('lodash');

function enforceObject(data) {
  return typeof data !== 'object' ? { _id: data } : data;
}

function enforceKeyValueObjectsArray(data) {
  return _.isArray(data) ? data : _.map(data, function(val, key) {
    return {
      _id: key,
      _value: val ? val.toString() : ''
    };
  });
}

function enforceValuesArray(data) {
  return _.isArray(data) ? data : _.keys(data);
}

function enforceReservationTablesArray(data) {
  return _.flatten(_.map(data, function(tables, area) {
    return _.map(enforceValuesArray(tables), function(table) {
      return {
        area: area,
        table: table
      };
    });
  }));
}

function enforceNumeric(data) {
  var val = parseFloat(data);
  return val && !isNaN(val) ? val.toString() : null;
}

function enforceDate(data) {
  try {
    return new Date(data).toISOString();  
  } catch (e) {
    console.warn('cannot parse ' + data + ' as date');
    return null;
  }
}

var requestDataPropertyHandlers = {
  'venue': enforceObject,
  'user': enforceObject,
  'guest': enforceObject,
  'guest.birthday': enforceDate,
  'event': enforceObject,
  'event.flyer': enforceObject,
  'event.promoters': enforceValuesArray,
  'ticket': enforceObject,
  'ticket.questions': enforceKeyValueObjectsArray,
  'area': enforceObject,
  'party': enforceObject,
  'party.guest': enforceObject,
  'party.guest.birthday': enforceDate,
  'party.questions': enforceKeyValueObjectsArray,
  'reservation.servers': enforceValuesArray,
  'reservation.tables': enforceReservationTablesArray,
  'reservation.spends': enforceObject,
  'reservation.guest': enforceObject,
  'reservation.guest.birthday': enforceDate,
  'promotion': enforceObject,
  'promotion.days': enforceValuesArray,
  'promo': enforceObject,
  'promo.tickets': enforceValuesArray,
  'referrer': enforceObject,
  'date': enforceDate,
  'priority': enforceNumeric,
  'payment.reservation.gratuity': enforceNumeric,
  'payment.reservation.tax': enforceNumeric
};

exports.requestData = function(data) {
  if (_.isObject(data)) {
    _.each(requestDataPropertyHandlers, function(handler, prop) {
      var val = _.get(data, prop);
      if (val) {
        _.set(data, prop, handler(val));
      } else if (val === '') {
        _.set(data, prop, null);
      }
    });
  } else if (!_.isNil(data)) {
    return _.set({}, '_value', data);
  }
  return data;
}

exports.responseData = function(data) {
  if (_.isObject(data)) {
    if (!_.isArray(data)) {
      if (!_.some(data, _.negate(_.isObject))) {
        return _.map(data, function(val, key) {
          return _.set(val, '_id', key);
        });
      }
    }
  } else if (!_.isNil(data)) {
    return _.set({}, '_value', data);
  }
  return data;
}
