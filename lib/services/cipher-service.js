// PreparedHealth
// Create Date: 2015-02-16
// Copyright PreparedHealth 2015
// Purpose: Contains code for encrypting/decrypting payloads
var log = require('../services/log-service.js').getLogger('cipher');
var forge = require('node-forge');

var self = this;
var protectedValues = {
  contents: true,
  patient: true,
  transform: true
};

var parsePayload = function(key, value) {
  try { 
    var payload = JSON.parse(value);
    var decryptedPayload = self.decrypt(payload.t, key, payload.s, payload.i);
    if (decryptedPayload) {
      return JSON.parse(decryptedPayload);
    } else {
      log.error('Unable to decrypt payload: ' + key + ' ; value: ' + value);
      return '';
    }
  }catch(err){
    log.error('Error attempting to decrypt payload: ' + key , err);
    return '';
  }
};

this.encryptRecord = function(passkey, record) {
  //log.info('record to encrypt with key', record, passkey);
  Object.keys(record).forEach(function(key) {
    if (protectedValues[key]) {
      var value = record[key];
      record[key] = JSON.stringify(self.encrypt(JSON.stringify(value), passkey));
      //	log.info('encrypted record', record);
    }
  });
  return record;
};

this.decryptRecord = function(id, record) {
  if (!record) return record;
  Object.keys(record).forEach(function(key) {
    if (protectedValues[key]) {
      var value = record[key];
      record[key] = parsePayload(id, value);
      log.info('decrypted record', record);
    }
  });
  return record;
};

this.decryptPayload = function(id, payload) {
  if (!payload) return payload;
  var result = parsePayload(id, payload);
  if ( !result ) return {};
  else return result;
};

this.encrypt = function(message, password) {
  var salt = forge.random.getBytesSync(128);
  var key = forge.pkcs5.pbkdf2(password, salt, 4, 32);
  var iv = forge.random.getBytesSync(32);
  var cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({
    iv: iv
  });
  cipher.update(forge.util.createBuffer(message, 'utf8'));
  cipher.finish();
  var cipherText = forge.util.encode64(cipher.output.getBytes());
  return {
    s: forge.util.encode64(salt),
    i: forge.util.encode64(iv),
    t: cipherText
  };
};

this.decrypt = function(cipherText, password, salt, iv) {
  var key = forge.pkcs5.pbkdf2(password, forge.util.decode64(salt), 4, 32);
  var decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({
    iv: forge.util.decode64(iv)
  });
  decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText, 'utf8')));
  decipher.finish();
  return decipher.output.toString();
};

module.exports = {
  encrypt: this.encrypt,
  decrypt: this.decrypt,
  encryptRecord: this.encryptRecord,
  decryptRecord: this.decryptRecord,
  decryptPayload : this.decryptPayload
};
