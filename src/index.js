'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                  * respect to https://github.com/cuth/postcss-pxtorem/
                                                                                                                                                                                                                                                                  **/


var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOpts = {
  rootValue: 100,
  unitPrecision: 5,
  selectorBlackList: [],
  propWhiteList: [],
  propBlackList: [],
  ignoreIdentifier: false,
  replace: true,
  mediaQuery: false,
  minPixelValue: 0
};

var toFixed = function toFixed(number, precision) {
  var multiplier = Math.pow(10, precision + 1);
  var wholeNumber = Math.floor(number * multiplier);

  return Math.round(wholeNumber / 10) * 10 / multiplier;
};

var createPxReplace = function createPxReplace(rootValue, identifier, unitPrecision, minPixelValue) {
  return function (m, $1) {
    if (!$1) return m;
    if (identifier && m.indexOf(identifier) === 0) return m.replace(identifier, '');
    var pixels = parseFloat($1);
    if (pixels < minPixelValue) return m;
    var fixedVal = toFixed(pixels / rootValue, unitPrecision);

    return fixedVal + 'rem';
  };
};

var declarationExists = function declarationExists(decls, prop, value) {
  return decls.some(function (decl) {
    return decl.prop === prop && decl.value === value;
  });
};

var blacklistedSelector = function blacklistedSelector(blacklist, selector) {
  if (typeof selector !== 'string') return false;

  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;

    return selector.match(regex);
  });
};

var blacklistedProp = function blacklistedProp(blacklist, prop) {
  if (typeof prop !== 'string') return false;

  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return prop.indexOf(regex) !== -1;

    return prop.match(regex);
  });
};

var handleIgnoreIdentifierRegx = function handleIgnoreIdentifierRegx(identifier) {
  var _identifier = identifier;
  var backslashfy = _identifier.split('').join('\\');
  backslashfy = '\\' + backslashfy;
  var pattern = '"[^"]+"|\'[^\']+\'|url\\([^\\)]+\\)|((' + backslashfy + '|\\d*)\\.?\\d+)px';

  return new RegExp(pattern, 'ig');
};

exports.default = _postcss2.default.plugin('postcss-plugin-px2rem', function (options) {
  var opts = _extends({}, defaultOpts, options);
  var pxRegex = /"[^"]+"|'[^']+'|url\([^\)]+\)|(\d*\.?\d+)px/ig;
  var identifier = opts.ignoreIdentifier;
  if (identifier && typeof identifier === 'string') {
    identifier = identifier.replace(/\s+/g, '');
    opts.replace = true;
    pxRegex = handleIgnoreIdentifierRegx(identifier);
  } else {
    identifier = false;
  }
  var pxReplace = createPxReplace(opts.rootValue, identifier, opts.unitPrecision, opts.minPixelValue);

  return function (css) {
    css.walkDecls(function (decl, i) {
      var _decl = decl;
      // 1st check 'px'
      if (_decl.value && _decl.value.indexOf('px') === -1) return;
      // 2nd check property black list
      if (blacklistedProp(opts.propBlackList, _decl.prop)) return;
      // 3rd check property white list
      if (opts.propWhiteList.length && opts.propWhiteList.indexOf(_decl.prop) === -1) return;
      // 4th check seletor black list
      if (blacklistedSelector(opts.selectorBlackList, _decl.parent.selector)) return;

      var value = _decl.value && _decl.value.replace(pxRegex, pxReplace);

      // if rem unit already exists, do not add or replace
      if (declarationExists(_decl.parent, _decl.prop, value)) return;

      if (opts.replace) {
        _decl.value = value;
      } else {
        _decl.parent.insertAfter(i, _decl.clone({
          value: value
        }));
      }
    });

    if (opts.mediaQuery) {
      css.walkAtRules('media', function (rule) {
        var _rule = rule;
        if (_rule.params.indexOf('px') === -1) return;
        _rule.params = _rule.params.replace(pxRegex, pxReplace);
      });
    }
  };
});
module.exports = exports['default'];
