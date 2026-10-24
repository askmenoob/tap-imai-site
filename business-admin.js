var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "node_modules/qrcode/lib/can-promise.js"(exports, module) {
    module.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports) {
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports.getSymbolSize = function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    };
    exports.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    };
    exports.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports.setToSJISFunction = function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    };
    exports.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports.toSJIS = function toSJIS(kanji) {
      return toSJISFunction(kanji);
    };
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
    exports.L = { bit: 1 };
    exports.M = { bit: 0 };
    exports.Q = { bit: 3 };
    exports.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports.L;
        case "m":
        case "medium":
          return exports.M;
        case "q":
        case "quartile":
          return exports.Q;
        case "h":
        case "high":
          return exports.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    exports.isValid = function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    };
    exports.from = function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    BitBuffer.prototype = {
      get: function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      },
      put: function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      },
      getLengthInBits: function() {
        return this.length;
      },
      putBit: function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }
    };
    module.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    exports.getRowColCoords = function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    };
    exports.getPositions = function getPositions(version) {
      const coords = [];
      const pos = exports.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    };
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports.getPositions = function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    };
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
    exports.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports.isValid = function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    };
    exports.from = function from(value) {
      return exports.isValid(value) ? parseInt(value, 10) : void 0;
    };
    exports.getPenaltyN1 = function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module2 = data.get(row, col);
          if (module2 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module2;
            sameCountCol = 1;
          }
          module2 = data.get(col, row);
          if (module2 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module2;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    };
    exports.getPenaltyN2 = function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    };
    exports.getPenaltyN3 = function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    };
    exports.getPenaltyN4 = function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    };
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    exports.applyMask = function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    };
    exports.getBestMask = function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports.applyMask(p, data);
        const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
        exports.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    };
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
    exports.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports) {
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    })();
    exports.log = function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    };
    exports.exp = function exp(n) {
      return EXP_TABLE[n];
    };
    exports.mul = function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    };
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports) {
    var GF = require_galois_field();
    exports.mul = function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    };
    exports.mod = function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    };
    exports.generateECPolynomial = function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    };
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    ReedSolomonEncoder.prototype.initialize = function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    };
    ReedSolomonEncoder.prototype.encode = function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    };
    module.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports) {
    exports.isValid = function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    };
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports) {
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports.KANJI = new RegExp(kanji, "g");
    exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports.BYTE = new RegExp(byte, "g");
    exports.NUMERIC = new RegExp(numeric, "g");
    exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports.testKanji = function testKanji(str) {
      return TEST_KANJI.test(str);
    };
    exports.testNumeric = function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    };
    exports.testAlphanumeric = function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    };
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports) {
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports.MIXED = {
      bit: -1
    };
    exports.getCharCountIndicator = function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    };
    exports.getBestModeForData = function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports.KANJI;
      else return exports.BYTE;
    };
    exports.toString = function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    };
    exports.isValid = function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports.NUMERIC;
        case "alphanumeric":
          return exports.ALPHANUMERIC;
        case "kanji":
          return exports.KANJI;
        case "byte":
          return exports.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    exports.from = function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports) {
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    exports.from = function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    };
    exports.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    };
    exports.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    };
    exports.getEncodedBits = function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    };
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports) {
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    };
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    NumericData.getBitsLength = function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    };
    NumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    NumericData.prototype.getBitsLength = function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    };
    NumericData.prototype.write = function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    };
    module.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    AlphanumericData.getBitsLength = function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    };
    AlphanumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    AlphanumericData.prototype.getBitsLength = function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    };
    AlphanumericData.prototype.write = function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    };
    module.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    ByteData.getBitsLength = function getBitsLength(length) {
      return length * 8;
    };
    ByteData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    ByteData.prototype.getBitsLength = function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    };
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    KanjiData.getBitsLength = function getBitsLength(length) {
      return length * 13;
    };
    KanjiData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    KanjiData.prototype.getBitsLength = function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    };
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports, module) {
    "use strict";
    var dijkstra = {
      single_source_shortest_paths: function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open = dijkstra.PriorityQueue.make();
        open.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open.empty()) {
          closest = open.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      },
      extract_shortest_path_from_predecessor_list: function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      },
      find_path: function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      },
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        },
        default_sorter: function(a, b) {
          return a.cost - b.cost;
        },
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        },
        /**
         * Return the highest priority element in the queue.
         */
        pop: function() {
          return this.queue.shift();
        },
        empty: function() {
          return this.queue.length === 0;
        }
      }
    };
    if (typeof module !== "undefined") {
      module.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports) {
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    exports.fromArray = function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    };
    exports.fromString = function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports.fromArray(mergeSegments(optimizedSegs));
    };
    exports.rawSplit = function rawSplit(data) {
      return exports.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    };
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports) {
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    exports.create = function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    };
  }
});

// node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "node_modules/qrcode/lib/renderer/utils.js"(exports) {
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    exports.getOptions = function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width,
        scale: width ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    };
    exports.getScale = function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    };
    exports.getImageWidth = function getImageWidth(qrSize, opts) {
      const scale = exports.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    };
    exports.qrToImageData = function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    };
  }
});

// node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "node_modules/qrcode/lib/renderer/canvas.js"(exports) {
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    exports.render = function render2(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    };
    exports.renderToDataURL = function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    };
  }
});

// node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    function qrToPath(data, size, margin) {
      let path = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path;
    }
    exports.render = function render2(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    };
  }
});

// node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "node_modules/qrcode/lib/browser.js"(exports) {
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    exports.create = QRCode2.create;
    exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// src/orders-ui.mjs
var states = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
var fulfillmentLabels = { unpaid: "Menunggu bayaran", awaiting_address: "Bayaran diterima \xB7 perlukan alamat", received: "Alamat diterima", preparing: "Sedang disediakan", shipped: "Dihantar", completed: "Selesai" };
var paymentLabels = { creating: "Bil sedang disediakan", pending: "Menunggu bayaran", failed: "Bayaran belum berjaya", creation_failed: "Bil belum dapat disediakan", cancelled: "Dibatalkan", paid: "Bayaran disahkan", review: "Bayaran memerlukan semakan admin" };
var money = (value) => new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(value / 100);
var date = (value) => value ? new Date(value).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" }) : "\u2014";
var addressFields = { name: ["Nama penerima", 100], phone: ["Telefon penerima", 30], notes: ["Nota penghantaran (pilihan)", 300], line1: ["Alamat baris 1", 160], line2: ["Alamat baris 2 (pilihan)", 160], postcode: ["Poskod", 5], city: ["Bandar", 80], state: ["Negeri", 40] };
function createOrdersUI({ customer: customer2, api: api2 }) {
  const panel = document.createElement("section");
  panel.id = "orders-panel";
  panel.className = "orders-panel";
  panel.innerHTML = '<h2>Pesanan saya</h2><p class="help">Semak pembelian, alamat dan penghantaran untuk perniagaan ini. Status penghantaran dikemas kini oleh super admin.</p><label for="orders-picker">Pilih pesanan</label><div class="orders-selector"><select id="orders-picker"></select><button type="button" id="orders-refresh" class="secondary" aria-label="Muat semula pesanan"><span aria-hidden="true">\u21BB</span><span class="orders-refresh-label">Muat semula pesanan</span></button><button type="button" id="orders-more" class="secondary" hidden>Pesanan terdahulu</button></div><p id="orders-status" role="status" aria-live="polite"></p><div id="order-body" hidden><nav class="customer-subnav orders-tabs" aria-label="Bahagian pesanan"></nav><section id="order-details"></section><form id="order-address-form" novalidate><div id="order-recipient"></div><div id="order-address"></div><p class="help">Penghantaran Malaysia sahaja. Alamat disimpan untuk pesanan ini dan hanya boleh dilihat oleh pemilik yang berhak serta super admin.</p><button type="submit" id="order-address-save">Simpan maklumat penghantaran</button><p id="order-address-lock" class="help" hidden>Pesanan sudah dihantar. Hubungi super admin untuk pembetulan alamat.</p></form><section id="order-tracking"><p id="order-tracking-state" class="notice"></p><div id="order-tracking-info"></div><ol id="order-timeline"></ol><form id="order-fulfillment-form"><label for="order-fulfillment-state">Status penyediaan / penghantaran</label><select id="order-fulfillment-state"></select><label for="order-courier">Nama kurier</label><input id="order-courier" maxlength="80" placeholder="Contoh: Pos Laju / J&T Express"><label for="order-tracking-number">Nombor tracking</label><input id="order-tracking-number" maxlength="100"><label for="order-tracking-url">Pautan tracking kurier (pilihan)</label><input id="order-tracking-url" type="url" maxlength="500" placeholder="https://"><button type="submit" id="order-fulfillment-save">Simpan status penghantaran</button></form></section><a id="order-contact" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>WhatsApp tentang pesanan \u2197</a><p class="help" id="order-contact-help" hidden>Draf mesej mengandungi nama perniagaan dan ID pesanan. Semak dan hantar sendiri melalui WhatsApp.</p></div>';
  if (!customer2) panel.querySelector("h2").textContent = "Pesanan pelanggan";
  const $2 = (id) => panel.querySelector("#" + id), el = (tag, text) => {
    const n = document.createElement(tag);
    if (text) n.textContent = text;
    return n;
  };
  const inputs = {};
  for (const [key, [caption, max]] of Object.entries(addressFields)) {
    const unit = el("div");
    unit.className = "order-field";
    unit.dataset.field = key;
    const label = el("label", caption);
    label.htmlFor = "order-address-" + key;
    const input = el(key === "state" ? "select" : "input");
    input.id = label.htmlFor;
    input.name = key;
    inputs[key] = input;
    if (key === "state") {
      const option = el("option", "Pilih negeri");
      option.value = "";
      input.append(option);
      for (const state of states) {
        const option2 = el("option", state);
        option2.value = state;
        input.append(option2);
      }
    } else {
      input.maxLength = max;
      input.type = key === "phone" ? "tel" : "text";
      if (key === "postcode") {
        input.inputMode = "numeric";
        input.pattern = "[0-9]{5}";
      }
    }
    input.required = !["line2", "notes"].includes(key);
    input.autocomplete = "off";
    unit.append(label, input);
    $2(["name", "phone", "notes"].includes(key) ? "order-recipient" : "order-address").append(unit);
  }
  let page = null, order = null, items = [], cursor2 = null, tab = "details", sequence = 0, signature = "", working = false;
  const tabs = { details: "Butiran pesanan", recipient: "Penerima", address: "Alamat", tracking: "Tracking" };
  for (const [key, label] of Object.entries(tabs)) {
    const button = el("button", label);
    button.type = "button";
    button.dataset.tab = key;
    button.onclick = () => {
      tab = key;
      renderTabs();
    };
    panel.querySelector(".orders-tabs").append(button);
  }
  function renderTabs() {
    panel.dataset.tab = tab;
    const physical = order?.paymentStatus === "paid" && order.includesPhysical;
    if (!physical) tab = "details";
    for (const b of panel.querySelector(".orders-tabs").children) {
      b.hidden = b.dataset.tab !== "details" && !physical;
      b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false");
    }
    const contactVisible = order?.paymentStatus === "paid" && ["details", "tracking"].includes(tab);
    $2("order-contact").hidden = !contactVisible;
    $2("order-contact-help").hidden = !contactVisible;
    $2("order-details").hidden = tab !== "details";
    $2("order-address-form").hidden = !["recipient", "address"].includes(tab);
    $2("order-recipient").hidden = tab !== "recipient";
    $2("order-address").hidden = tab !== "address";
    $2("order-tracking").hidden = tab !== "tracking";
  }
  function controls() {
    $2("orders-picker").disabled = working || !items.length;
    $2("orders-refresh").disabled = working;
    $2("orders-more").disabled = working;
    const locked = ["shipped", "completed"].includes(order?.fulfillmentState);
    for (const input of Object.values(inputs)) input.disabled = working || locked;
    $2("order-address-save").disabled = working;
    $2("order-address-save").hidden = locked;
    $2("order-address-lock").hidden = !locked;
    for (const node of $2("order-fulfillment-form").querySelectorAll("input,select,button")) node.disabled = working || !order?.shipping;
  }
  function render2() {
    if (!order) {
      $2("order-body").hidden = true;
      for (const input of Object.values(inputs)) input.value = "";
      for (const id of ["order-details", "order-tracking-info", "order-timeline"]) $2(id).replaceChildren();
      for (const id of ["order-courier", "order-tracking-number", "order-tracking-url"]) $2(id).value = "";
      $2("order-contact").removeAttribute("href");
      return;
    }
    $2("order-body").hidden = false;
    const details = $2("order-details");
    details.replaceChildren();
    const badge = el("p", paymentLabels[order.paymentStatus] || order.paymentStatus);
    badge.className = "notice";
    badge.dataset.payment = order.paymentStatus;
    details.append(badge);
    for (const [label, value] of [["ID pesanan", order.id], ["Tarikh pesanan", date(order.createdAt)], ["Rujukan bayaran", order.invoice || "\u2014"]]) {
      const line = el("p");
      line.append(el("strong", label + ": "), el("span", value));
      details.append(line);
    }
    const list = el("ul");
    list.className = "order-items";
    for (const item of order.items) list.append(el("li", item.name + " \xD7 " + item.quantity + " \xB7 " + money(item.totalCents)));
    details.append(list, el("p", (order.paymentStatus === "paid" ? "Jumlah dibayar: " : "Jumlah bil: ") + money(order.amountCents)));
    if (order.mode !== "live") details.append(el("p", "DEMO / SANDBOX \u2014 bukan bayaran sebenar."));
    if (order.includesPhysical) details.append(el("p", order.shippingCents ? "Caj penghantaran dalam pesanan: " + money(order.shippingCents) : "Caj penghantaran diurus secara berasingan dengan super admin."));
    else if (order.paymentStatus === "paid") details.append(el("p", "Pesanan digital sahaja. Alamat penghantaran tidak diperlukan."));
    for (const [key, input] of Object.entries(inputs)) input.value = order.shipping?.[key] || "";
    $2("order-tracking-state").dataset.state = order.fulfillmentState;
    $2("order-tracking-state").textContent = fulfillmentLabels[order.fulfillmentState] || order.fulfillmentState;
    const info = $2("order-tracking-info");
    info.replaceChildren();
    if (order.fulfillment?.courier) info.append(el("p", order.fulfillment.courier + " \xB7 " + order.fulfillment.trackingNumber));
    if (order.fulfillment?.trackingURL) {
      const a = el("a", "Semak tracking kurier \u2197");
      a.href = order.fulfillment.trackingURL;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "button secondary";
      info.append(a);
    }
    if (order.fulfillmentState === "awaiting_address") info.append(el("p", "Simpan nama penerima dan alamat untuk meneruskan penyediaan pesanan."));
    $2("order-timeline").replaceChildren();
    for (const entry of order.fulfillment?.timeline || []) $2("order-timeline").append(el("li", (fulfillmentLabels[entry.state] || entry.state) + " \xB7 " + date(entry.at)));
    const options = { received: ["preparing"], preparing: ["preparing", "shipped"], shipped: ["shipped", "completed"], completed: ["completed"] };
    const choose = $2("order-fulfillment-state");
    choose.replaceChildren();
    for (const state of options[order.fulfillmentState] || []) {
      const option = el("option", fulfillmentLabels[state]);
      option.value = state;
      choose.append(option);
    }
    $2("order-fulfillment-form").hidden = customer2 || !order.shipping;
    for (const [id, key] of [["order-courier", "courier"], ["order-tracking-number", "trackingNumber"], ["order-tracking-url", "trackingURL"]]) $2(id).value = order.fulfillment?.[key] || "";
    const paid = order.paymentStatus === "paid";
    $2("order-contact").hidden = !paid;
    $2("order-contact-help").hidden = !paid;
    if (paid) {
      const link = new URL("https://wa.me/60103250032");
      link.searchParams.set("text", "Salam SmartTap, saya ingin bertanya tentang pesanan.\nPerniagaan: " + page.profile.name + "\nID pesanan: " + order.id);
      $2("order-contact").href = link.href;
    } else $2("order-contact").removeAttribute("href");
    renderTabs();
    controls();
  }
  const path = () => "/links/" + page.id + "/orders";
  async function select(id) {
    const current = ++sequence;
    working = true;
    controls();
    $2("orders-status").textContent = "Memuatkan pesanan\u2026";
    try {
      const result = await api2(path() + "/" + id);
      if (current !== sequence) return;
      order = result;
      tab = "details";
      $2("orders-status").textContent = "";
      render2();
    } catch (e) {
      if (current === sequence) {
        $2("orders-status").textContent = e.message;
        order = null;
        render2();
      }
    } finally {
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  }
  async function load2(more = false) {
    if (!page) return;
    const current = ++sequence;
    working = true;
    controls();
    $2("orders-status").textContent = "Memuatkan pesanan\u2026";
    try {
      const result = await api2(path() + (more && cursor2 ? "?cursor=" + encodeURIComponent(cursor2) : ""));
      if (current !== sequence) return;
      items = more ? [...items, ...result.items.filter((item) => !items.some((old) => old.id === item.id))] : result.items;
      cursor2 = result.cursor;
      $2("orders-more").hidden = !cursor2;
      const previous = order?.id;
      $2("orders-picker").replaceChildren();
      for (const item of items) {
        const option = el("option", date(item.createdAt) + " \xB7 " + money(item.amountCents) + " \xB7 " + (item.paymentStatus === "paid" ? fulfillmentLabels[item.fulfillmentState] : paymentLabels[item.paymentStatus]) + " \xB7 " + item.id.slice(-8));
        option.value = item.id;
        $2("orders-picker").append(option);
      }
      if (!items.length) {
        order = null;
        render2();
        $2("orders-status").textContent = "Belum ada pesanan ToyyibPay untuk perniagaan ini.";
        return;
      }
      const id = items.some((item) => item.id === previous) ? previous : items[0].id;
      $2("orders-picker").value = id;
      working = false;
      await select(id);
    } catch (e) {
      if (current === sequence) $2("orders-status").textContent = e.message;
    } finally {
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  }
  $2("orders-picker").onchange = () => select($2("orders-picker").value);
  $2("orders-refresh").onclick = () => load2();
  $2("orders-more").onclick = () => load2(true);
  async function save(action, data) {
    if (!order || working) return;
    const current = sequence;
    working = true;
    controls();
    $2("orders-status").textContent = "Menyimpan pesanan\u2026";
    try {
      const result = await api2(path() + "/" + order.id + "/" + action, { method: "PUT", body: { revision: order.revision, ...data } });
      if (current !== sequence) return;
      order = result;
      render2();
      $2("orders-status").textContent = "Maklumat pesanan berjaya disimpan.";
    } catch (e) {
      if (current === sequence) $2("orders-status").textContent = e.message;
    } finally {
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  }
  $2("order-address-form").onsubmit = (event) => {
    event.preventDefault();
    if (working) return;
    const invalid = Object.values(inputs).find((input) => !input.disabled && !input.checkValidity());
    if (invalid) {
      tab = ["name", "phone", "notes"].includes(invalid.name) ? "recipient" : "address";
      renderTabs();
      invalid.focus();
      invalid.reportValidity();
      return;
    }
    save("address", { address: Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value.trim()])) });
  };
  $2("order-fulfillment-form").onsubmit = (event) => {
    event.preventDefault();
    save("fulfillment", { state: $2("order-fulfillment-state").value, courier: $2("order-courier").value.trim(), trackingNumber: $2("order-tracking-number").value.trim(), trackingURL: $2("order-tracking-url").value.trim() });
  };
  return { panel, show(item) {
    const next = item.id + "|" + (item.checkout?.id || "") + "|" + (item.checkout?.status || "");
    const changed = page?.id !== item.id;
    page = item;
    if (next === signature) return;
    signature = next;
    if (changed) {
      order = null;
      items = [];
      render2();
      $2("orders-picker").replaceChildren();
    }
    load2();
  }, clear() {
    sequence++;
    page = null;
    order = null;
    items = [];
    cursor2 = null;
    signature = "";
    working = false;
    render2();
    $2("orders-picker").replaceChildren();
    $2("orders-status").textContent = "";
  } };
}

// src/payment-alerts.mjs
function createPaymentAlerts({ api: api2, open, canOpen }) {
  const $2 = (id) => document.getElementById(id), bell = $2("payment-bell"), panel = $2("payment-alerts"), count = $2("payment-count"), status = $2("payment-alert-status"), list = $2("payment-alert-list"), refreshButton = $2("payment-alert-refresh");
  let active = false, generation = 0, timer, flight = null, lastCount = null;
  const schedule = () => {
    clearTimeout(timer);
    if (active) timer = setTimeout(() => {
      if (document.hidden) schedule();
      else refresh();
    }, 6e4);
  };
  async function refresh() {
    if (!active) return;
    if (flight) return flight;
    const current = generation;
    refreshButton.disabled = true;
    const work = (async () => {
      try {
        const data = await api2("/api/admin/pending-payments");
        if (!active || current !== generation) return;
        count.textContent = String(data.count);
        lastCount = data.count;
        bell.classList.toggle("has-pending", data.count > 0);
        status.textContent = data.count ? "Pilih perniagaan untuk semak bayaran." : "Tiada bayaran menunggu semakan.";
        list.replaceChildren();
        for (const item of data.items) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "payment-alert-item secondary";
          const name = document.createElement("strong");
          name.textContent = item.name;
          name.dataset.noI18n = "";
          const detail = document.createElement("span");
          detail.dataset.noI18n = "";
          detail.textContent = new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(item.amountCents / 100) + " \xB7 " + new Date(item.submittedAt).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" });
          button.append(name, detail);
          button.addEventListener("click", async () => {
            if (!canOpen()) return;
            button.disabled = true;
            try {
              await open(item.id);
            } catch {
              if (active && current === generation) status.textContent = "Bayaran belum dapat dibuka. Cuba lagi.";
            } finally {
              button.disabled = false;
            }
          });
          list.append(button);
        }
      } catch {
        if (!active || current !== generation) return;
        count.textContent = lastCount === null ? "!" : String(lastCount);
        status.textContent = "Semakan bayaran belum dapat dikemas kini. Muat semula bayaran.";
      } finally {
        if (active && current === generation) {
          refreshButton.disabled = false;
          schedule();
        }
      }
    })();
    flight = work;
    try {
      await work;
    } finally {
      if (flight === work) flight = null;
    }
  }
  bell.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    bell.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) refresh();
  });
  refreshButton.addEventListener("click", refresh);
  document.addEventListener("visibilitychange", () => {
    if (active && !document.hidden) refresh();
  });
  return { refresh, start() {
    this.stop();
    active = true;
    refresh();
  }, stop() {
    active = false;
    generation++;
    clearTimeout(timer);
    flight = null;
    lastCount = null;
    count.textContent = "\u2026";
    bell.classList.remove("has-pending");
    bell.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    list.replaceChildren();
    status.textContent = "";
  } };
}

// import-service/appearance.mjs
var appearanceFields = {
  theme: { label: "Tema halaman", options: { classic: "Klasik \xB7 krim & hijau", dark: "Gelap \xB7 arang & putih", bright: "Ceria \xB7 putih & warna jenama" } },
  accent: { label: "Warna utama", type: "color" },
  cover: { label: "Cover tersimpan", type: "url", max: 500 },
  menu: { label: "Pautan menu / katalog", type: "url", max: 500 },
  directions: { label: "Pautan lokasi Google Maps", type: "url", max: 500 },
  address: { label: "Alamat perniagaan", max: 240 },
  hours: { label: "Waktu operasi", max: 240 },
  promoTitle: { label: "Tajuk promosi", max: 70 },
  promoText: { label: "Penerangan promosi", max: 180 },
  promoURL: { label: "Pautan promosi", type: "url", max: 500 },
  promoStart: { label: "Promosi bermula (waktu Malaysia)", type: "datetime-local" },
  promoEnd: { label: "Promosi tamat (waktu Malaysia)", type: "datetime-local" }
};

// src/admin.js
var import_qrcode = __toESM(require_browser(), 1);

// import-service/contacts.mjs
function malaysiaPhone(value) {
  if (typeof value !== "string") return null;
  let number = value.trim().replace(/^tel:/i, "");
  if (!/^[+\d\s().-]+$/.test(number)) return null;
  number = number.replace(/[\s().-]/g, "");
  if (number.startsWith("0060")) number = number.slice(2);
  else if (number.startsWith("+60")) number = number.slice(1);
  else if (number.startsWith("0")) number = "60" + number.slice(1);
  return /^60[1-9]\d{7,9}$/.test(number) ? number : null;
}
function whatsappFromPhone(value) {
  const number = malaysiaPhone(value);
  return number ? "https://wa.me/" + number : null;
}

// src/google-login.mjs
function googleLogin({ clientId, container, onCredential, onError, prompt = false }) {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.onload = () => {
    window.google.accounts.id.initialize({ client_id: clientId, callback: (result) => onCredential(result.credential), auto_select: false });
    window.google.accounts.id.renderButton(container, { type: "standard", theme: "outline", size: "large", text: "signin_with", shape: "rectangular" });
    if (prompt) window.google.accounts.id.prompt();
  };
  script.onerror = () => onError("Butang Google tidak dapat dimuatkan. Semak sambungan dan muat semula.");
  document.head.append(script);
}

// src/payment-prompt.mjs
function paymentPrompt(item, now = Date.now()) {
  const annual = item.subscription?.plan === "annual";
  const remaining = Date.parse(item.subscription?.expiresAt || "") - now;
  const expired = item.state === "expired";
  const soon = annual && item.state === "active" && remaining > 0 && remaining <= 30 * 864e5;
  return {
    message: expired ? "Langganan halaman telah tamat. Renew untuk mengaktifkan semula halaman." : soon ? "Tarikh tamat langganan semakin hampir. Anda boleh renew lebih awal pada pautan dan QR yang sama." : "",
    label: expired || soon ? "Renew halaman" : annual ? "Renew / beli add-on" : "Beli pakej / add-on"
  };
}

// src/order-support.mjs
function orderSupportLink(item, { customer: customer2 = false, language = "ms" } = {}) {
  const approved = item.renewal?.status === "approved" ? item.renewal : null;
  const id = approved?.id || item.subscription?.lastPaymentId;
  if (!customer2 || typeof id !== "string" || !id || item.manualState === "deleted") return null;
  const shipping = approved?.provider === "toyyibpay" && !!(approved.includesPhysical || approved.items?.some((line) => ["bundle", "nfc", "extra_nfc", "table_sticker"].includes(line.id) && line.quantity > 0));
  const en = language === "en";
  const lines = [shipping ? en ? "Hello SmartTap super admin, my payment is confirmed. Here are the delivery details for my NFC order." : "Salam super admin SmartTap, bayaran saya telah disahkan. Berikut maklumat penghantaran pesanan NFC saya." : en ? "Hello SmartTap super admin, I would like to ask about my confirmed order." : "Salam super admin SmartTap, saya ingin bertanya tentang pesanan yang telah disahkan.", (en ? "Business: " : "Perniagaan: ") + item.profile.name, (en ? "Order ID: " : "ID pesanan: ") + id];
  if (approved?.items?.length) lines.push((en ? "Order: " : "Pesanan: ") + approved.items.map((line) => line.name + " \xD7 " + line.quantity).join(", "));
  if (shipping) lines.push((en ? "Payment reference: " : "Rujukan bayaran: ") + approved.reference, "", ...en ? ["Recipient name: ", "Contact number: ", "Delivery address: ", "Postcode: ", "City: ", "State: ", "Delivery notes (optional): "] : ["Nama penerima: ", "Nombor telefon: ", "Alamat penghantaran: ", "Poskod: ", "Bandar: ", "Negeri: ", "Nota penghantaran (pilihan): "], "");
  lines.push((en ? "Page link: " : "Pautan halaman: ") + item.url);
  const url = new URL("https://wa.me/60103250032");
  url.searchParams.set("text", lines.join("\n"));
  return { url: url.href, shipping };
}

// src/management-ui.mjs
var money2 = (cents) => new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(cents / 100);
var date2 = (value) => value ? new Date(value).toLocaleDateString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "long", year: "numeric" }) : "Belum bermula";
var stateLabels = { active: "Aktif", disabled: "Dinyahaktifkan", deleted: "Dipadam", pending: "Menunggu pengaktifan", expired: "Langganan tamat", nfc_only: "NFC sahaja \xB7 sekali bayar" };
function createManagementUI({ customer: customer2, api: api2, onUpdate, onBusy }) {
  const panel = document.createElement("section");
  panel.className = "management-panel";
  panel.innerHTML = `<section id="admin-message-box" class="admin-message-box" hidden aria-labelledby="admin-message-title"><h3 id="admin-message-title">Mesej daripada super admin</h3><p id="admin-message-text" data-no-i18n></p><p id="admin-message-time" class="help" data-no-i18n></p><p id="admin-message-state" role="status" aria-live="polite"></p><div id="admin-message-reply" hidden><strong>Balasan pelanggan</strong><p id="admin-message-reply-text" data-no-i18n></p></div><form id="message-reply-form" hidden><label for="message-reply-text">Nombor transaksi / balasan anda</label><textarea id="message-reply-text" required maxlength="500" rows="3"></textarea><button type="submit">Hantar balasan kepada super admin</button></form><button id="message-resolve" type="button" class="secondary" hidden>Tandakan selesai</button><a id="message-whatsapp" class="button secondary" href="https://wa.me/60103250032" target="_blank" rel="noopener noreferrer" hidden>Hubungi super admin di WhatsApp \u2197</a></section>
  <form id="admin-message-form" class="admin-message-compose" ${customer2 ? "hidden" : ""}><h3>Hantar mesej kepada pelanggan</h3><label for="admin-message-input">Mesej / tindakan yang diperlukan</label><textarea id="admin-message-input" required maxlength="1000" rows="3" placeholder="Contoh: Sila berikan nombor transaksi bank untuk semakan bayaran."></textarea><p class="help">Mesej muncul pada halaman edit pelanggan. Mesej baharu menggantikan mesej semasa; rekod sebelumnya disimpan.</p><button type="submit">Hantar mesej</button></form><h3>Status halaman & pakej</h3><p id="page-state" class="notice"></p><p id="subscription-summary"></p><p id="google-listing-status" class="notice" hidden>Google Review belum tersedia. Super admin akan menyambungkan lokasi apabila tersedia di Google Maps.</p><p id="direct-review-wrap" hidden>Pautan untuk Google Review NFC: <a id="direct-review" target="_blank" rel="noopener noreferrer">Buka Google Review \u2197</a></p><a href="/subscribe/" target="_blank" rel="noopener noreferrer">Lihat semua pakej \u2197</a>
  <div id="lifecycle-actions" class="actions" ${customer2 ? "hidden" : ""}><button type="button" id="state-toggle" class="secondary">Nyahaktif</button><button type="button" id="delete-open" class="danger">Padam halaman</button><button type="button" id="state-restore" class="secondary" hidden>Pulihkan sebagai nyahaktif</button></div>
  <form id="delete-form" class="notice" hidden><p>Halaman akan disembunyikan dan akses pelanggan ditarik balik. Super admin boleh memulihkannya. Salinan rekod dikekalkan.</p><label for="delete-name">Taip nama perniagaan untuk sahkan</label><input id="delete-name" required autocomplete="off"><button class="danger">Sahkan padam</button><button id="delete-cancel" type="button" class="secondary">Batal</button></form>
  <p id="management-status" role="status" aria-live="polite"></p>
  <div id="billing-section"><h3>Langganan & pembayaran</h3><p id="billing-availability"></p><p id="payment-summary"></p>
  <div id="order-support" class="notice" hidden><h4>Pertanyaan pesanan</h4><p>Hubungi super admin tentang pesanan yang telah disahkan, termasuk penyediaan NFC dan penghantaran.</p><a id="order-whatsapp" class="button" target="_blank" rel="noopener noreferrer">WhatsApp super admin tentang pesanan \u2197</a><p class="help">Draf mesej disediakan dengan nama perniagaan dan ID pesanan. Semak dan hantar sendiri dalam WhatsApp.</p></div>
  <section id="gateway-panel" class="gateway-panel" hidden><h4>Pembayaran ToyyibPay</h4><p id="gateway-availability"></p><p id="gateway-order" data-no-i18n></p><p id="gateway-status" role="status" aria-live="polite"></p><div class="actions"><a id="gateway-continue" class="button" hidden>Teruskan pembayaran \u2197</a><button type="button" id="gateway-check" class="secondary" hidden>Semak status bayaran</button><button type="button" id="gateway-cancel" class="secondary" hidden>Batalkan bil belum dibayar</button></div></section><p id="renewal-reminder" class="renewal-reminder" hidden></p><div id="payment-disclosure" class="actions" hidden><button id="payment-toggle" type="button" class="secondary" aria-controls="payment-form" aria-expanded="false">Renew / beli add-on</button><span class="help">Bayaran diproses melalui ToyyibPay.</span></div>
  <form id="payment-form" hidden><label for="payment-package">Pakej</label><select id="payment-package"></select><div class="quantity-grid"><div><label for="payment-nfc">NFC tambahan \xB7 RM30/unit</label><input id="payment-nfc" type="number" min="0" max="10" step="1" value="0"></div><div><label for="payment-stickers">NFC table sticker \xB7 kuantiti</label><input id="payment-stickers" type="number" min="0" max="200" step="1" value="0"></div></div><p class="help">Sticker: RM20/unit untuk 1\u201319 unit; RM15/unit untuk 20 unit atau lebih.</p><div id="payment-quote" role="status"></div><button id="gateway-pay" type="button" hidden>Bayar dengan ToyyibPay \u2197</button><p id="gateway-pay-help" class="help" hidden>Jumlah pesanan ditetapkan oleh SmartTap. Status disahkan terus dengan ToyyibPay.</p><p class="help">Harga produk tidak termasuk penghantaran. Urus penghantaran dan cajnya secara berasingan dengan super admin.</p>
  <details id="manual-method" open><summary>Bayaran manual (QR DuitNow)</summary><div id="payment-instructions" hidden><p>Bayar jumlah di atas menggunakan QR DuitNow ini. Semak nama penerima sebelum mengesahkan bayaran dalam aplikasi bank.</p><img id="payment-qr" width="1118" height="1762" alt="Gambar penuh QR DuitNow asal \u2014 NIK AZFAR BIN NIK ZAINAL, MAE Maybank"><strong id="payment-payee"></strong><div class="actions"><a id="payment-open" class="button secondary" target="_blank" rel="noopener noreferrer">Lihat QR penuh \u2197</a><a id="payment-download" class="button secondary" download="smarttap-duitnow-asal.jpeg">Muat turun gambar QR asal</a></div></div>
  <p class="notice">Selepas membayar, hantar rujukan transaksi. Langganan dilanjutkan selepas super admin mengesahkan wang diterima. Jangan bayar semasa menggunakan demo tempatan.</p><label for="payment-reference">Rujukan transaksi bank</label><input id="payment-reference" required minlength="3" maxlength="80" autocomplete="off"><label for="payment-date">Tarikh bayaran</label><input id="payment-date" type="date" required><button id="payment-submit">Hantar untuk semakan bayaran</button></details></form>
  <form id="payment-review" hidden><h4>Semakan super admin</h4><p id="review-details"></p><label class="check-label"><input id="bank-confirm" type="checkbox"> Saya telah menyemak akaun bank dan wang benar-benar diterima untuk transaksi ini.</label><label for="review-note">Nota kepada pelanggan (pilihan)</label><input id="review-note" maxlength="200"><div class="actions"><button id="payment-approve">Sahkan bayaran</button><button type="button" id="payment-reject" class="secondary">Tolak permohonan</button></div></form></div>`;
  document.getElementById("edit-form").before(panel);
  const $2 = (id) => panel.querySelector("#" + id);
  let current = null, config = null, quote = null, sequence = 0, messageSequence = 0, gatewaySequence = 0, gatewayReturnChecked = null, working = false, paymentOpen = !customer2, paymentAvailable = false;
  function paymentVisibility(open) {
    paymentOpen = open;
    sequence++;
    quote = null;
    $2("payment-form").hidden = !paymentAvailable || customer2 && !open;
    $2("payment-instructions").hidden = true;
    $2("payment-toggle").setAttribute("aria-expanded", String(customer2 && open));
    $2("payment-toggle").textContent = open ? "Tutup borang bayaran" : paymentPrompt(current || {}).label;
    $2("payment-qr").removeAttribute("src");
    $2("payment-download").removeAttribute("href");
    $2("payment-open").removeAttribute("href");
    $2("payment-submit").disabled = true;
    $2("gateway-pay").disabled = true;
  }
  const today = () => new Date(Date.now() + 8 * 36e5).toISOString().slice(0, 10);
  const options = () => ({ package: $2("payment-package").value, extraNfcQty: Number($2("payment-nfc").value), stickerQty: Number($2("payment-stickers").value) });
  function clear() {
    messageSequence++;
    current = null;
    $2("admin-message-box").hidden = true;
    $2("admin-message-text").textContent = "";
    $2("admin-message-reply-text").textContent = "";
    $2("message-reply-text").value = "";
    $2("admin-message-input").value = "";
    gatewaySequence++;
    $2("gateway-panel").hidden = true;
    $2("gateway-order").textContent = "";
    $2("gateway-status").textContent = "";
    $2("gateway-continue").removeAttribute("href");
    paymentAvailable = false;
    paymentVisibility(!customer2);
    $2("payment-disclosure").hidden = true;
    $2("renewal-reminder").hidden = true;
    $2("payment-reference").value = "";
    $2("review-note").value = "";
    $2("delete-form").hidden = true;
    $2("order-support").hidden = true;
    $2("order-whatsapp").removeAttribute("href");
  }
  function showMessage(item) {
    const message = item.adminMessage, note = !message ? item.renewal?.note : "";
    const visible = !!(message && (!customer2 || message.status !== "resolved") || note);
    $2("admin-message-box").hidden = !visible;
    $2("admin-message-form").hidden = customer2 || item.manualState === "deleted" || !item.ownerEmail;
    $2("admin-message-text").textContent = message?.text || note || "";
    $2("admin-message-time").textContent = message?.sentAt ? new Date(message.sentAt).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" }) : "";
    $2("admin-message-state").textContent = message?.status === "replied" ? "Balasan telah dihantar. Menunggu tindakan super admin." : message?.status === "resolved" ? "Mesej telah diselesaikan." : message ? customer2 ? "Tindakan anda diperlukan." : "Menunggu tindakan pelanggan." : "Nota semakan bayaran daripada super admin.";
    $2("admin-message-box").dataset.status = message?.status || "open";
    $2("admin-message-reply").hidden = !message?.reply;
    $2("admin-message-reply-text").textContent = message?.reply?.text || "";
    $2("message-reply-form").hidden = !customer2 || message?.status !== "open";
    $2("message-resolve").hidden = customer2 || !message || message.status === "resolved";
    $2("message-whatsapp").hidden = !customer2 || !!message;
  }
  function orderSupport(item) {
    const support = orderSupportLink(item, { customer: customer2, language: document.documentElement.lang });
    const visible = !!support;
    $2("order-support").hidden = !visible;
    $2("order-whatsapp").removeAttribute("href");
    if (!visible) return;
    $2("order-whatsapp").href = support.url;
    $2("order-support").querySelector("h4").textContent = support.shipping ? "Hantar alamat penghantaran" : "Pertanyaan pesanan";
    $2("order-support").querySelector("p").textContent = support.shipping ? "Bayaran ToyyibPay anda telah disahkan. Hantar nama penerima, nombor telefon dan alamat penghantaran untuk pesanan NFC anda kepada super admin." : "Hubungi super admin tentang pesanan yang telah disahkan, termasuk penyediaan NFC dan penghantaran.";
    $2("order-whatsapp").textContent = support.shipping ? "Hantar alamat melalui WhatsApp \u2197" : "WhatsApp super admin tentang pesanan \u2197";
    $2("order-support").querySelector(".help").textContent = support.shipping ? "Draf mengandungi butiran pesanan dan ruang alamat. Lengkapkan alamat, semak dan hantar sendiri dalam WhatsApp." : "Draf mesej disediakan dengan nama perniagaan dan ID pesanan. Semak dan hantar sendiri dalam WhatsApp.";
  }
  window.addEventListener("smarttap:language", () => {
    if (current) orderSupport(current);
  });
  async function cart() {
    quote = null;
    $2("gateway-pay").disabled = true;
    $2("payment-submit").disabled = true;
    $2("payment-instructions").hidden = true;
    const item = current, version = ++sequence;
    if (!item || !config?.enabled || !paymentAvailable || customer2 && !paymentOpen) return;
    $2("payment-quote").textContent = "Mengira jumlah\u2026";
    try {
      const result = await api2("/links/" + item.id + "/quote", { method: "POST", body: options() });
      if (version !== sequence || current?.id !== item.id) return;
      quote = result;
      $2("payment-quote").replaceChildren();
      for (const line of result.items) {
        const row = document.createElement("p");
        row.textContent = line.name + " \xD7 " + line.quantity + " \xB7 " + money2(line.totalCents);
        $2("payment-quote").append(row);
      }
      const total = document.createElement("strong");
      total.textContent = "Jumlah produk: " + money2(result.amountCents);
      $2("payment-quote").append(total);
      if (config.manualEnabled !== false) {
        const image = "/assets/duitnow-original.jpeg";
        $2("payment-qr").src = image;
        $2("payment-download").href = image;
        $2("payment-open").href = image;
        $2("payment-payee").textContent = config.payee;
        $2("payment-instructions").hidden = false;
        $2("payment-submit").disabled = false;
      }
      $2("gateway-pay").disabled = !config.gateway?.enabled;
    } catch (error) {
      if (version === sequence) $2("payment-quote").textContent = error.message;
    }
  }
  function gatewayPanel(item) {
    const settings = config?.gateway || {}, checkout = item.checkout;
    $2("gateway-panel").hidden = customer2 && !settings.enabled && !checkout;
    $2("gateway-availability").textContent = settings.enabled ? location.hostname === "127.0.0.1" ? "SIMULASI TEMPATAN \u2014 tiada wang dibayar." : settings.mode === "sandbox" ? "Mod ujian ToyyibPay \u2014 bukan pembayaran sebenar." : "Bayar melalui ToyyibPay. Pengaktifan dibuat selepas transaksi disahkan." : customer2 ? "Pembayaran dalam talian belum dibuka. Hubungi super admin." : settings.reason === "awaiting_verification" ? "ToyyibPay disediakan. Pembayaran sebenar ditutup sehingga akaun verified." : "ToyyibPay belum diaktifkan. Hubungi super admin.";
    $2("gateway-pay").hidden = !settings.enabled;
    $2("gateway-pay-help").hidden = !settings.enabled;
    if (changedGatewayId !== item.id) {
      $2("manual-method").open = !settings.enabled;
      changedGatewayId = item.id;
    }
    $2("gateway-order").textContent = checkout ? checkout.id + " \xB7 " + money2(checkout.amountCents) + (checkout.invoice ? " \xB7 " + checkout.invoice : "") : "";
    $2("gateway-status").textContent = checkout ? { creating: "Sedang menyediakan bil. Muat semula sebentar lagi.", pending: "Bayaran belum disahkan. Teruskan pembayaran atau semak status.", failed: "Cubaan bayaran tidak berjaya. Anda boleh mencuba semula pada bil yang sama.", paid: "Bayaran ToyyibPay disahkan.", cancelled: "Bil belum dibayar telah dibatalkan.", creation_failed: "Bil belum dapat disediakan. Anda boleh cuba semula.", review: "Bayaran diterima dan memerlukan tindakan super admin." }[checkout.status] || "" : "";
    const reviewable = settings.enabled && checkout && !["paid", "cancelled", "creation_failed"].includes(checkout.status);
    $2("gateway-check").hidden = !reviewable;
    $2("gateway-cancel").hidden = !reviewable;
    $2("gateway-continue").hidden = true;
    $2("gateway-continue").removeAttribute("href");
  }
  let changedGatewayId;
  function paymentURL(value) {
    const url = new URL(value);
    const local = location.hostname === "127.0.0.1" && url.origin === location.origin && url.pathname.startsWith("/demo/toyyibpay/");
    if (!local && (url.protocol !== "https:" || !["toyyibpay.com", "dev.toyyibpay.com"].includes(url.hostname) || url.username || url.password || url.port)) throw Error("Pautan pembayaran tidak sah.");
    return url.href;
  }
  async function gatewayAction(kind) {
    if (working || !current || !config?.gateway?.enabled) return;
    if (kind === "create" && !quote) return;
    working = true;
    onBusy(true);
    const item = current, version = ++gatewaySequence;
    $2("gateway-status").textContent = kind === "create" ? "Menyediakan bil ToyyibPay\u2026" : "Menyemak status ToyyibPay\u2026";
    for (const node of panel.querySelectorAll("button,input,select,textarea")) node.disabled = true;
    try {
      const result = await api2(kind === "create" ? "/links/" + item.id + "/checkout" : "/checkout/" + item.checkout.id + "/" + (kind === "cancel" ? "cancel" : "status"), { method: "POST", body: kind === "create" ? { ...options(), revision: item.revision, expectedAmountCents: quote.amountCents } : {} });
      if (current?.id !== item.id || version !== gatewaySequence) return;
      const checkout = result.checkout || result, updated = result.page || await api2("/links/" + item.id);
      if (current?.id !== item.id || version !== gatewaySequence) return;
      onUpdate(updated);
      await show(updated);
      if (checkout.paymentUrl) {
        const url = paymentURL(checkout.paymentUrl);
        $2("gateway-continue").href = url;
        $2("gateway-continue").hidden = false;
        if (kind === "create") location.assign(url);
      }
    } catch (error) {
      if (current?.id === item.id && version === gatewaySequence) $2("gateway-status").textContent = error.message;
    } finally {
      working = false;
      onBusy(false);
      for (const node of panel.querySelectorAll("button,input,select,textarea")) node.disabled = false;
      $2("gateway-pay").disabled = !quote || !config?.gateway?.enabled;
      if (!quote) $2("payment-submit").disabled = true;
    }
  }
  async function show(item) {
    const changed = current?.id !== item.id, messageChanged = current?.adminMessage?.id !== item.adminMessage?.id, oldStatus = current?.renewal?.status;
    current = item;
    if (changed || messageChanged) {
      $2("message-reply-text").value = "";
      $2("management-status").textContent = "";
    }
    showMessage(item);
    if (changed) {
      messageSequence++;
      $2("message-reply-text").value = "";
      $2("admin-message-input").value = "";
      gatewaySequence++;
      $2("gateway-panel").hidden = true;
      $2("gateway-order").textContent = "";
      $2("gateway-status").textContent = "";
      $2("gateway-continue").removeAttribute("href");
      paymentAvailable = false;
      paymentVisibility(!customer2);
      $2("payment-disclosure").hidden = true;
      $2("renewal-reminder").hidden = true;
    }
    orderSupport(item);
    $2("page-state").textContent = stateLabels[item.state] || item.state;
    for (const id of ["page-state", "subscription-summary"]) $2(id).dataset.state = item.state;
    $2("subscription-summary").textContent = item.subscription?.plan === "annual" ? "Halaman tahunan \xB7 tamat " + date2(item.subscription.expiresAt) : item.subscription?.plan === "nfc_only" ? "NFC terus ke Google Review. Tiada langganan halaman QR." : "Rekod sedia ada. Pelan tahunan belum direkodkan; status asal dikekalkan.";
    $2("google-listing-status").hidden = item.profile.googleStatus !== "pending";
    $2("direct-review-wrap").hidden = item.subscription?.plan !== "nfc_only" || !item.profile.google;
    if (item.profile.google) $2("direct-review").href = item.profile.google;
    else $2("direct-review").removeAttribute("href");
    $2("state-toggle").textContent = item.manualState === "disabled" ? "Aktifkan halaman" : "Nyahaktifkan halaman";
    $2("state-toggle").hidden = item.manualState === "deleted";
    $2("delete-open").hidden = item.manualState === "deleted";
    $2("state-restore").hidden = item.manualState !== "deleted";
    $2("delete-form").hidden = true;
    if (changed) {
      $2("management-status").textContent = "";
      $2("payment-reference").value = "";
      $2("payment-date").value = today();
      $2("payment-nfc").value = "0";
      $2("payment-stickers").value = "0";
    }
    try {
      config = await api2("/plan");
      if (current?.id !== item.id) return;
    } catch (error) {
      $2("billing-availability").textContent = error.message;
      return;
    }
    $2("manual-method").hidden = config.manualEnabled === false;
    for (const id of ["payment-reference", "payment-date"]) {
      $2(id).required = config.manualEnabled !== false;
      $2(id).disabled = config.manualEnabled === false;
    }
    gatewayPanel(item);
    $2("billing-availability").textContent = config.enabled ? config.gateway?.enabled ? config.manualEnabled === false ? "Pakej halaman ditawarkan setahun sahaja. Bayar melalui ToyyibPay; status disahkan secara automatik." : "Pakej halaman ditawarkan setahun sahaja. Bayaran ToyyibPay disahkan secara automatik; bayaran manual disemak oleh super admin." : "Pakej halaman ditawarkan setahun sahaja. Bayaran disemak secara manual." : "Permohonan bayaran belum dibuka. Hubungi super admin untuk maklumat lanjut.";
    const pending = item.renewal?.status === "pending";
    paymentAvailable = config.enabled && !pending && item.manualState !== "deleted";
    if (!paymentAvailable || oldStatus !== item.renewal?.status && item.renewal?.status === "approved") paymentVisibility(!customer2);
    $2("payment-form").hidden = !paymentAvailable || customer2 && !paymentOpen;
    $2("payment-review").hidden = customer2 || !pending || !config.enabled || item.manualState === "deleted";
    const prompt = paymentPrompt(item);
    $2("renewal-reminder").textContent = prompt.message;
    $2("renewal-reminder").hidden = !customer2 || !paymentAvailable || !prompt.message;
    $2("payment-disclosure").hidden = !customer2 || !paymentAvailable;
    $2("payment-toggle").textContent = paymentOpen ? "Tutup borang bayaran" : prompt.label;
    $2("payment-toggle").setAttribute("aria-expanded", String(customer2 && paymentOpen));
    const payment = item.renewal;
    $2("payment-summary").textContent = payment ? ({ pending: "Menunggu semakan bayaran", approved: "Bayaran disahkan", rejected: "Permohonan ditolak" }[payment.status] || payment.status) + " \xB7 " + money2(payment.amountCents) + " \xB7 " + payment.reference + (payment.note ? " \xB7 " + payment.note : "") : "";
    $2("review-details").textContent = payment ? "Rujukan: " + payment.reference + " \xB7 " + payment.paidDate + " \xB7 " + money2(payment.amountCents) + " \xB7 " + payment.items.map((x) => x.name + " \xD7 " + x.quantity).join(", ") : "";
    $2("bank-confirm").checked = false;
    $2("review-note").value = "";
    const selected2 = $2("payment-package").value, annual = !!item.subscription?.lastPaymentId && item.subscription.plan === "annual";
    $2("payment-package").replaceChildren();
    for (const product of config.packages) {
      if (product.id === "addons" && !item.subscription?.lastPaymentId || product.id !== "addons" && (annual && product.id !== "renew" || !annual && product.id === "renew")) continue;
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.name + (product.id === "addons" ? "" : " \xB7 " + money2(product.amountCents) + (product.months ? " / " + product.months + " bulan" : " \xB7 sekali bayar"));
      $2("payment-package").append(option);
    }
    if (!changed && selected2 && [...$2("payment-package").options].some((x) => x.value === selected2)) $2("payment-package").value = selected2;
    if (changed) {
      const params = new URLSearchParams(location.search);
      const kind = params.get("package");
      if (kind && [...$2("payment-package").options].some((x) => x.value === kind)) {
        $2("payment-package").value = kind;
        if (customer2 && paymentAvailable) paymentVisibility(true);
      }
      for (const [id, key, max] of [["payment-nfc", "extraNfcQty", 10], ["payment-stickers", "stickerQty", 200]]) {
        const n = Number(params.get(key) || 0);
        if (Number.isInteger(n) && n >= 0 && n <= max) $2(id).value = String(n);
      }
    }
    const returning = new URLSearchParams(location.search).get("payment");
    if (customer2 && config.gateway?.enabled && returning === item.checkout?.id && gatewayReturnChecked !== returning) {
      gatewayReturnChecked = returning;
      queueMicrotask(() => gatewayAction("status"));
    }
    if (oldStatus === "pending" && payment?.status === "approved") {
      $2("payment-reference").value = "";
      $2("payment-nfc").value = "0";
      $2("payment-stickers").value = "0";
    }
    if (!$2("payment-form").hidden) await cart();
  }
  async function action(path, body, message) {
    if (working || !current) return;
    working = true;
    onBusy(true);
    const id = current.id, version = messageSequence;
    $2("management-status").textContent = "Menyimpan\u2026";
    for (const node of panel.querySelectorAll("button,input,select,textarea")) node.disabled = true;
    try {
      const updated = await api2("/links/" + id + path, { method: "POST", body });
      if (current?.id !== id || version !== messageSequence) return;
      onUpdate(updated);
      await show(updated);
      if (path === "/message" && body.action === "send") $2("admin-message-input").value = "";
      if (path === "/message-reply") $2("message-reply-text").value = "";
      $2("management-status").textContent = message;
    } catch (error) {
      $2("management-status").textContent = error.message;
    } finally {
      working = false;
      onBusy(false);
      for (const node of panel.querySelectorAll("button,input,select,textarea")) node.disabled = false;
      if (!quote) $2("payment-submit").disabled = true;
    }
  }
  $2("state-toggle").onclick = () => action("/state", { state: current.manualState === "disabled" ? "active" : "disabled", revision: current.revision }, "Status halaman dikemas kini. URL dan QR kekal sama.");
  $2("state-restore").onclick = () => action("/state", { state: "disabled", revision: current.revision }, "Halaman dipulihkan sebagai nyahaktif. Semak langganan sebelum mengaktifkan.");
  $2("delete-open").onclick = () => {
    $2("delete-form").hidden = false;
    $2("delete-name").value = "";
    $2("delete-name").focus();
  };
  $2("delete-cancel").onclick = () => {
    $2("delete-form").hidden = true;
  };
  $2("delete-form").onsubmit = (event) => {
    event.preventDefault();
    action("/state", { state: "deleted", confirmName: $2("delete-name").value, revision: current.revision }, "Halaman dipadam daripada paparan awam dan senarai pelanggan. Rekod boleh dipulihkan oleh super admin.");
  };
  $2("payment-package").addEventListener("change", cart);
  for (const id of ["payment-nfc", "payment-stickers"]) $2(id).addEventListener("input", cart);
  $2("payment-toggle").onclick = () => {
    if (working || !paymentAvailable) return;
    paymentVisibility(!paymentOpen);
    if (paymentOpen) cart();
  };
  $2("payment-form").onsubmit = (event) => {
    event.preventDefault();
    if (config?.manualEnabled === false) {
      gatewayAction("create");
      return;
    }
    if (!quote) return;
    action("/renewal", { ...options(), reference: $2("payment-reference").value.trim(), paidDate: $2("payment-date").value, amountCents: quote.amountCents, revision: current.revision }, "Rujukan dihantar. Tunggu semakan bank oleh super admin.");
  };
  const decide = (decision) => action("/decision", { requestId: current.renewal.id, decision, revision: current.revision, confirmBank: $2("bank-confirm").checked, note: $2("review-note").value }, decision === "approve" ? "Bayaran disahkan. Tempoh halaman dikemas kini jika pakej mengandungi langganan tahunan." : "Permohonan bayaran ditolak. Pelanggan boleh menghantar rujukan yang betul.");
  $2("payment-review").onsubmit = (event) => {
    event.preventDefault();
    decide("approve");
  };
  $2("payment-reject").onclick = () => decide("reject");
  $2("gateway-pay").onclick = () => gatewayAction("create");
  $2("gateway-check").onclick = () => gatewayAction("status");
  $2("gateway-cancel").onclick = () => gatewayAction("cancel");
  $2("admin-message-form").onsubmit = (event) => {
    event.preventDefault();
    action("/message", { action: "send", text: $2("admin-message-input").value, revision: current.revision }, "Mesej telah dihantar kepada pelanggan.");
  };
  $2("message-reply-form").onsubmit = (event) => {
    event.preventDefault();
    action("/message-reply", { messageId: current.adminMessage.id, text: $2("message-reply-text").value, revision: current.revision }, "Balasan telah dihantar kepada super admin.");
  };
  $2("message-resolve").onclick = () => action("/message", { action: "resolve", messageId: current.adminMessage.id, revision: current.revision }, "Mesej telah diselesaikan.");
  return { show, clear };
}

// src/google-listing-tools.mjs
function createGoogleListingTools({ input, name, onChange, search, lookup }) {
  const el = (tag, text) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  };
  const panel = el("section");
  panel.className = "notice google-listing-tools";
  panel.append(el("h3", "Perniagaan belum ada di Google Maps?"));
  const label = el("label"), pending = el("input");
  pending.type = "checkbox";
  pending.id = "google-listing-pending";
  label.htmlFor = pending.id;
  label.append(pending, document.createTextNode(" Google Review belum tersedia"));
  panel.append(label);
  const help = el("p", "Simpan halaman tanpa Google Review dahulu. Pin atau alamat sahaja tidak mencipta Place ID. Google menyemak penambahan tempat; pemilik mungkin perlu membuat pengesahan.");
  panel.append(help);
  const links = el("div");
  links.className = "actions";
  for (const [text, url] of [["Panduan tambah tempat di Google Maps \u2197", "https://support.google.com/maps/answer/6320846?hl=en"], ["Daftar Google Business Profile \u2197", "https://business.google.com/add"]]) {
    const a = el("a", text);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    links.append(a);
  }
  panel.append(links);
  const query = el("input");
  query.type = "search";
  query.maxLength = 160;
  query.id = "google-listing-query";
  const qlabel = el("label", "Nama dan bandar / alamat untuk carian semula");
  qlabel.htmlFor = query.id;
  const find = el("button", "Cari semula di Google Maps");
  find.type = "button";
  find.className = "secondary";
  const status = el("p");
  status.setAttribute("role", "status");
  const results = el("div");
  results.className = "google-listing-results";
  panel.append(qlabel, query, find, status, results);
  let generation = 0, active = true, backup = "";
  const sync = () => {
    input.required = !pending.checked;
    input.disabled = !active || pending.checked;
  };
  pending.onchange = () => {
    generation++;
    results.replaceChildren();
    status.textContent = "";
    find.disabled = !active;
    if (pending.checked) {
      backup = input.value;
      input.value = "";
    } else input.value = backup;
    sync();
    onChange();
  };
  find.onclick = async () => {
    if (!active) return;
    const term = query.value.trim() || name();
    if (term.length < 3) {
      status.textContent = "Masukkan nama dan lokasi perniagaan.";
      return;
    }
    const current = ++generation;
    find.disabled = true;
    results.replaceChildren();
    status.textContent = "Mencari perniagaan\u2026";
    try {
      const data = await search(term);
      if (current !== generation || !active) return;
      status.textContent = data.places?.length ? "Google Maps \xB7 Pilih perniagaan dan alamat yang tepat." : "Belum ditemui di Google Maps. Cuba lagi selepas tempat tersedia.";
      for (const place of data.places || []) {
        const choose = el("button", place.name + (place.address ? " \u2014 " + place.address : ""));
        choose.type = "button";
        choose.className = "secondary";
        choose.onclick = async () => {
          if (!active || current !== generation) return;
          find.disabled = true;
          for (const b of results.children) b.disabled = true;
          status.textContent = "Mendapatkan pautan Google Review\u2026";
          try {
            const result = await lookup(place.token);
            if (current !== generation || !active) return;
            if (!result.profile?.google) throw new Error("Pautan Google Review belum tersedia.");
            input.value = result.profile.google;
            backup = input.value;
            pending.checked = false;
            sync();
            onChange();
            results.replaceChildren();
            status.textContent = "Pautan Google Review dipilih. Tekan Simpan untuk menyambungkan pada URL dan QR yang sama.";
          } catch (error) {
            if (current === generation) status.textContent = error.message;
          } finally {
            if (current === generation) {
              find.disabled = !active;
              for (const b of results.children) b.disabled = !active;
            }
          }
        };
        results.append(choose);
      }
    } catch (error) {
      if (current === generation) status.textContent = error.message;
    } finally {
      if (current === generation) find.disabled = !active;
    }
  };
  return { panel, isPending: () => pending.checked, set(profile) {
    generation++;
    results.replaceChildren();
    status.textContent = profile.googleStatus === "pending" ? "Google Review belum tersedia" : "Google Review telah disambungkan";
    pending.checked = profile.googleStatus === "pending";
    backup = profile.google || "";
    query.value = profile.name || "";
    sync();
  }, lock(value) {
    active = !value;
    pending.disabled = value;
    find.disabled = value;
    query.disabled = value;
    for (const b of results.children) b.disabled = value;
    sync();
  }, invalidate() {
    generation++;
    results.replaceChildren();
  }, apply(profile) {
    if (pending.checked) {
      profile.google = "";
      profile.googleStatus = "pending";
    } else delete profile.googleStatus;
  } };
}

// src/customer-area.mjs
var menus = [["package", "Status pakej", "\u25C8"], ["business", "Sunting perniagaan", "\u270E"], ["page", "Sunting paparan", "\u25A7"], ["orders", "Pesanan saya", "\u25A4"], ["my", "Halaman saya", "\u2197"]];
function createCustomerArea({ coverNodes, onSelect }) {
  const $2 = (id) => document.getElementById(id), dashboard = $2("dashboard"), editor = $2("editor"), form = $2("edit-form");
  document.body.classList.add("customer-workspace");
  const list = dashboard.firstElementChild;
  list.classList.add("customer-legacy-list");
  const bar = document.createElement("div");
  bar.className = "customer-toolbar";
  bar.innerHTML = '<div><p class="eyebrow">RUANG PELANGGAN</p><h1 id="customer-title" tabindex="-1">Status pakej</h1><p id="customer-business-name" data-no-i18n></p></div><button type="button" id="customer-menu-toggle" class="secondary" aria-label="Buka menu pelanggan" aria-expanded="false" aria-controls="customer-menu">\u2630 <span>Menu</span></button>';
  const nav = document.createElement("nav");
  nav.id = "customer-menu";
  nav.className = "customer-menu";
  nav.setAttribute("aria-label", "Menu pelanggan");
  for (const [id, label, icon] of menus) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.view = id;
    b.innerHTML = '<span aria-hidden="true">' + icon + "</span><span>" + label + "</span>";
    b.onclick = () => open(id, true);
    nav.append(b);
  }
  const account = document.createElement("button");
  account.type = "button";
  account.textContent = "Log keluar";
  account.className = "customer-logout";
  account.onclick = () => $2("logout").click();
  nav.append(account);
  const stage = document.createElement("div");
  stage.className = "customer-stage";
  stage.id = "customer-stage";
  const packageView = document.createElement("section");
  packageView.id = "customer-package";
  const orderView = $2("orders-panel");
  const myView = document.createElement("section");
  myView.id = "customer-my";
  const picker = document.createElement("select");
  picker.id = "customer-page-picker";
  picker.setAttribute("aria-label", "Pilih halaman perniagaan");
  picker.onchange = () => onSelect(picker.value);
  myView.append(picker, $2("refresh"), $2("more"), $2("list-status"), $2("public-sharing"));
  const empty = document.createElement("p");
  empty.className = "notice";
  empty.id = "customer-empty";
  empty.textContent = "Pilih halaman perniagaan untuk mengurus maklumat anda.";
  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "customer-menu-backdrop";
  backdrop.tabIndex = -1;
  backdrop.setAttribute("aria-label", "Tutup menu pelanggan");
  const closeMenu = document.createElement("button");
  closeMenu.type = "button";
  closeMenu.className = "customer-menu-close";
  closeMenu.textContent = "Tutup menu \xD7";
  nav.prepend(closeMenu);
  dashboard.prepend(bar, backdrop, nav, stage);
  stage.append(empty, packageView, editor, orderView, myView);
  const management2 = document.querySelector(".management-panel");
  packageView.append(management2);
  const subnav = document.createElement("nav");
  subnav.className = "customer-subnav";
  subnav.setAttribute("aria-label", "Bahagian status pakej");
  packageView.prepend(subnav);
  const groups = {};
  for (const [id, label] of [["overview", "Ringkasan"], ["buy", "Renew / beli"], ["gateway", "Status bayaran"], ["delivery", "Penghantaran"], ["messages", "Mesej"]]) {
    const section = document.createElement("div");
    section.className = "customer-package-section";
    section.id = "customer-section-" + id;
    management2.append(section);
    groups[id] = section;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.section = id;
    button.onclick = () => {
      sectionName = id;
      if (id === "buy" && $2("payment-form").hidden && !$2("payment-toggle").disabled) $2("payment-toggle").click();
      render2();
    };
    subnav.append(button);
  }
  const emptySections = {};
  for (const [name, text] of [["messages", "Tiada mesej baharu daripada super admin."], ["delivery", "Maklumat penghantaran tersedia selepas bayaran pesanan fizikal disahkan."], ["gateway", "Belum ada bil pembayaran. Pilih Renew / beli untuk menyediakan pesanan."]]) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent = text;
    groups[name].append(p);
    emptySections[name] = p;
  }
  const messageAlert = document.createElement("button");
  messageAlert.type = "button";
  messageAlert.className = "customer-message-alert";
  messageAlert.textContent = "Mesej daripada super admin";
  messageAlert.onclick = () => {
    sectionName = "messages";
    render2();
  };
  groups.overview.append(messageAlert);
  const move = (id, group) => {
    if ($2(id)) groups[group].append($2(id));
  };
  const statusHeading = $2("page-state").previousElementSibling;
  groups.overview.append(statusHeading);
  for (const id of ["page-state", "subscription-summary", "google-listing-status", "direct-review-wrap", "payment-summary", "renewal-reminder", "payment-disclosure"]) move(id, "overview");
  const orderShortcut = document.createElement("button");
  orderShortcut.type = "button";
  orderShortcut.className = "secondary";
  orderShortcut.textContent = "Buka Pesanan saya";
  orderShortcut.onclick = () => open("orders", true);
  groups.delivery.append(orderShortcut);
  move("admin-message-box", "messages");
  move("order-support", "delivery");
  move("gateway-panel", "gateway");
  move("payment-form", "buy");
  const packageLink = [...management2.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/subscribe/");
  if (packageLink) groups.overview.append(packageLink);
  $2("payment-toggle").addEventListener("click", () => {
    sectionName = $2("payment-form").hidden ? "overview" : "buy";
    render2();
  });
  const paymentForm = $2("payment-form"), paymentChildren = [...paymentForm.children];
  const cart = document.createElement("div"), checkout = document.createElement("div");
  cart.className = checkout.className = "customer-payment-step";
  let confirm = false;
  for (const node of paymentChildren) {
    if (node.id === "payment-quote") confirm = true;
    (confirm ? checkout : cart).append(node);
  }
  paymentForm.prepend(cart, checkout);
  const paymentTabs = document.createElement("nav");
  paymentTabs.className = "customer-subnav customer-payment-tabs";
  paymentTabs.setAttribute("aria-label", "Bahagian pembelian");
  let paymentTab = 0;
  const showCart = () => {
    cart.hidden = paymentTab !== 0;
    checkout.hidden = paymentTab !== 1;
    for (const [i, button] of [...paymentTabs.children].entries()) button.setAttribute("aria-current", i === paymentTab ? "page" : "false");
  };
  for (const [i, label] of ["Pesanan", "Jumlah & bayaran"].entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.onclick = () => {
      paymentTab = i;
      showCart();
    };
    paymentTabs.append(button);
  }
  paymentForm.prepend(paymentTabs);
  showCart();
  const fieldGroups = { business: [["name", "tagline"], ["logo"], ["phone", "whatsapp"], ["website", "instagram", "facebook", "tiktok", "threads"], ["google"]], page: [["theme", "accent"], ["cover"], ["menu", "directions"], ["address", "hours"], ["promoTitle", "promoText"], ["promoURL"], ["promoStart", "promoEnd"]] };
  const pages = { business: [], page: [] };
  for (const [view2, steps] of Object.entries(fieldGroups)) for (const keys of steps) {
    const group = document.createElement("div");
    group.className = "customer-field-step";
    group.dataset.fieldView = view2;
    if (keys.includes("instagram")) group.classList.add("customer-social-fields");
    for (const key of keys) {
      const input = $2("field-" + key), label = document.querySelector('label[for="field-' + key + '"]');
      const unit = document.createElement("div");
      unit.className = "customer-field";
      unit.append(label, input);
      if (key === "cover") unit.append(...coverNodes);
      if (key === "google" && $2("google-pending-note")) unit.append($2("google-pending-note"));
      group.append(unit);
    }
    $2("fields").append(group);
    pages[view2].push(group);
  }
  const fieldTabs = document.createElement("nav");
  fieldTabs.className = "customer-subnav customer-field-tabs";
  fieldTabs.setAttribute("aria-label", "Bahagian suntingan");
  form.prepend(fieldTabs);
  const tabLabels = { business: ["Maklumat", "Logo", "Hubungi", "Social Media", "Google Review"], page: ["Tema & warna", "Cover", "Menu & lokasi", "Alamat & waktu", "Promosi", "Pautan promosi", "Tarikh promosi"] };
  let view = "package", sectionName = "overview", activeTab = { business: 0, page: 0 }, selected2 = null;
  for (const [name, labels] of Object.entries(tabLabels)) for (const [i, label] of labels.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.fieldView = name;
    button.dataset.index = String(i);
    button.onclick = () => {
      activeTab[name] = i;
      render2();
    };
    fieldTabs.append(button);
  }
  const toggle = $2("customer-menu-toggle");
  function dismissMenu(restore = false) {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    nav.removeAttribute("role");
    nav.removeAttribute("aria-modal");
    stage.inert = false;
    bar.inert = false;
    document.querySelector(".app-header").inert = false;
    if (restore) toggle.focus();
  }
  toggle.onclick = () => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      dismissMenu(true);
      return;
    }
    toggle.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    backdrop.classList.add("is-open");
    if (matchMedia("(max-width:700px)").matches) {
      nav.setAttribute("role", "dialog");
      nav.setAttribute("aria-modal", "true");
      stage.inert = true;
      bar.inert = true;
      document.querySelector(".app-header").inert = true;
      closeMenu.focus();
    }
  };
  matchMedia("(max-width:700px)").addEventListener("change", () => dismissMenu());
  closeMenu.onclick = () => dismissMenu(true);
  backdrop.onclick = () => dismissMenu(true);
  document.addEventListener("keydown", (event) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      dismissMenu(true);
      return;
    }
    if (event.key === "Tab" && matchMedia("(max-width:700px)").matches) {
      const buttons = [...nav.querySelectorAll("button:not(:disabled)")];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  function open(next, focus = false) {
    view = next;
    dismissMenu();
    render2();
    if (focus) $2("customer-title").focus({ preventScroll: true });
  }
  function render2() {
    const active = !!selected2;
    empty.hidden = active;
    orderView.hidden = !active || view !== "orders";
    packageView.hidden = !active || view !== "package";
    myView.hidden = view !== "my";
    editor.hidden = !active || !["business", "page"].includes(view);
    for (const b of nav.querySelectorAll("[data-view]")) {
      b.setAttribute("aria-current", b.dataset.view === view ? "page" : "false");
      b.disabled = !active && b.dataset.view !== "my";
    }
    const title = menus.find((m) => m[0] === view)[1];
    if ($2("customer-title").textContent !== title) $2("customer-title").textContent = title;
    for (const [name, sections] of Object.entries(pages)) sections.forEach((node, i) => {
      node.hidden = view !== name || i !== activeTab[name];
    });
    for (const button of fieldTabs.children) {
      button.hidden = button.dataset.fieldView !== view;
      button.setAttribute("aria-current", Number(button.dataset.index) === activeTab[button.dataset.fieldView] ? "page" : "false");
    }
    for (const [name, node] of Object.entries(groups)) {
      const hide = name !== sectionName;
      if (node.hidden !== hide) node.hidden = hide;
    }
    for (const b of subnav.children) b.setAttribute("aria-current", b.dataset.section === sectionName ? "page" : "false");
    for (const [name, id] of Object.entries({ messages: "admin-message-box", delivery: "order-support", gateway: "gateway-panel" })) emptySections[name].hidden = !$2(id).hidden;
    const unread = !!selected2?.adminMessage && selected2.adminMessage.status !== "resolved";
    messageAlert.hidden = !unread;
    subnav.querySelector('[data-section="messages"]').dataset.unread = String(unread);
  }
  form.noValidate = true;
  form.addEventListener("submit", (event) => {
    const invalid = [...form.querySelectorAll("input,select,textarea")].find((input) => !input.disabled && !input.checkValidity());
    if (invalid) {
      event.preventDefault();
      event.stopImmediatePropagation();
      for (const [name, sections] of Object.entries(pages)) {
        const at = sections.findIndex((group) => group.contains(invalid));
        if (at >= 0) {
          view = name;
          activeTab[name] = at;
          break;
        }
      }
      render2();
      invalid.focus();
      invalid.reportValidity();
    }
  }, true);
  $2("cancel").addEventListener("click", () => open("my"));
  return { update(item) {
    if (!selected2) view = "package";
    selected2 = item;
    $2("customer-business-name").textContent = item.profile.name;
    picker.value = item.id;
    document.body.classList.add("customer-session");
    render2();
  }, list(items) {
    const current = picker.value;
    picker.replaceChildren();
    for (const item of items) {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.profile.name;
      picker.append(option);
    }
    picker.value = selected2?.id || current;
    document.body.classList.add("customer-session");
    if (!selected2) view = "my";
    render2();
  }, clear() {
    selected2 = null;
    document.body.classList.remove("customer-session");
    dismissMenu();
    view = "package";
    sectionName = "overview";
    activeTab = { business: 0, page: 0 };
    paymentTab = 0;
    showCart();
    render2();
  }, open };
}

// src/admin.js
var $ = (id) => document.getElementById(id);
var customer = document.body.dataset.role === "user";
var base = customer ? "/api/user" : "/api/admin";
var endpoint = location.hostname === "127.0.0.1" ? location.origin : window.SMARTTAP_IMPORT_CONFIG?.endpoint;
var fields = { name: "Nama perniagaan", logo: "URL logo", tagline: "Penerangan ringkas", google: "Google Review", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", threads: "Threads", phone: "Telefon perniagaan", whatsapp: "WhatsApp", website: "Laman web", ...Object.fromEntries(Object.entries(appearanceFields).map(([key, spec]) => [key, spec.label])) };
var listingTools = null;
var credential = "";
var records = [];
var cursor = null;
var selected = null;
var expiryTimer;
var session = 0;
var busy = false;
var saving = false;
var customerArea = null;
function lockControls(value) {
  saving = value;
  for (const id of ["save", "cancel", "refresh", "more", "save-owner", "owner-email"]) if ($(id)) $(id).disabled = value || id === "save" && customer && selected?.state !== "active";
  for (const field of Object.keys(fields)) if ($("field-" + field)) $("field-" + field).disabled = value || customer && selected?.state !== "active";
  for (const id of ["cover-file", "remove-cover"]) if ($(id)) $(id).disabled = value || customer && selected?.state !== "active";
  listingTools?.lock(value);
}
var management = createManagementUI({ customer, api: (path, options) => api(base + path, options), onBusy: lockControls, onUpdate: (item) => {
  selected = item;
  records = records.map((record) => record.id === item.id ? item : record);
  render();
  alerts?.refresh();
  customerArea?.update(item);
  ordersUI.show(item);
  $("edit-title").textContent = item.profile.name;
  if ($("public-sharing")) $("public-sharing").hidden = item.state === "nfc_only" || item.state === "deleted";
} });
var ordersUI = createOrdersUI({ customer, api: (path, options) => api(base + path, options) });
$("edit-form").before(ordersUI.panel);
var alerts = customer ? null : createPaymentAlerts({ api, open: async (id) => {
  if (saving) return;
  const current = session;
  const item = await api(base + "/links/" + id);
  if (current !== session || saving) return;
  await edit(item);
}, canOpen: () => !saving });
function logout(message = "Anda telah log keluar.") {
  coverPreview.hidden = true;
  coverStatus.textContent = "";
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
  credential = "";
  records = [];
  cursor = null;
  selected = null;
  session++;
  clearTimeout(expiryTimer);
  listingTools?.invalidate();
  management.clear();
  ordersUI.clear();
  alerts?.stop();
  customerArea?.clear();
  $("dashboard").hidden = true;
  $("editor").hidden = true;
  $("login-panel").hidden = false;
  $("records").replaceChildren();
  for (const field of Object.keys(fields)) $("field-" + field).value = "";
  if ($("owner-email")) $("owner-email").value = "";
  $("share").value = "";
  $("qr").removeAttribute("src");
  $("download").removeAttribute("href");
  $("open").removeAttribute("href");
  $("login-status").textContent = message;
  window.google?.accounts?.id?.disableAutoSelect();
}
async function api(path, { method = "GET", body, authenticated = true } = {}) {
  if (!endpoint) throw new Error("Sambungan SmartTap belum tersedia.");
  const response = await fetch(new URL(path, endpoint), { method, headers: { ...authenticated ? { Authorization: "Bearer " + credential } : {}, ...body ? { "Content-Type": "application/json" } : {} }, body: body ? JSON.stringify(body) : void 0, cache: "no-store", credentials: "omit" });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) logout("Sesi tamat. Log masuk semula.");
    throw Object.assign(new Error(result.error || "Permintaan tidak berjaya."), { status: response.status });
  }
  return result;
}
var date3 = (value) => value ? new Date(value).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" }) : "\u2014";
function render() {
  const query = $("filter").value.trim().toLowerCase();
  const shown = records.filter((item) => (item.profile.name + " " + item.url).toLowerCase().includes(query));
  $("records").replaceChildren();
  for (const item of shown) {
    const row = document.createElement("article");
    row.className = "record";
    const info = document.createElement("div");
    info.className = "record-info";
    const title = document.createElement("h3");
    title.textContent = item.profile.name;
    const link = document.createElement("a");
    link.href = item.url;
    link.textContent = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const meta = document.createElement("p");
    meta.textContent = (item.adminMessage && item.adminMessage.status !== "resolved" ? (customer ? "Mesej daripada super admin" : "Mesej pelanggan: " + (item.adminMessage.status === "replied" ? "balasan diterima" : "menunggu balasan")) + " \xB7 " : "") + (stateLabels[item.state] || "Aktif") + (item.profile.googleStatus === "pending" ? " \xB7 Google Review belum tersedia" : "") + (item.renewal?.status === "pending" ? " \xB7 Bayaran menunggu semakan" : "") + " \xB7 Dicipta " + date3(item.createdAt) + " \xB7 Dikemas kini " + date3(item.updatedAt) + (!customer ? " \xB7 " + (item.ownerEmail || "Gmail pemilik belum didaftarkan") : "");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Urus halaman";
    button.setAttribute("aria-label", "Urus " + item.profile.name);
    button.addEventListener("click", () => edit(item));
    info.append(title, link, meta);
    row.append(info, button);
    $("records").append(row);
  }
  $("list-status").textContent = records.length + " halaman dimuatkan" + (query ? " \xB7 " + shown.length + " padanan" : "") + ".";
  if (!shown.length) {
    const empty = document.createElement("p");
    empty.textContent = query ? "Tiada padanan dalam senarai yang dimuatkan." : customer ? "Tiada halaman didaftarkan untuk Gmail ini. Hubungi super admin untuk mendaftarkan Gmail yang betul." : "Belum ada pautan dijana.";
    $("records").append(empty);
  }
  $("more").hidden = !cursor;
  $("list-hint").textContent = cursor ? "Ada rekod lain. Tekan Muatkan lagi untuk melihat dan mencari dalam rekod berikutnya." : "Semua rekod telah dimuatkan.";
  customerArea?.list(records);
}
async function load(reset = false) {
  if (busy || saving) return;
  busy = true;
  const current = session;
  $("refresh").disabled = true;
  $("more").disabled = true;
  $("list-status").textContent = "Memuatkan rekod\u2026";
  try {
    const page = await api(base + "/links" + (!reset && cursor ? "?cursor=" + encodeURIComponent(cursor) : ""));
    if (current !== session) return;
    records = reset ? page.items : [...records, ...page.items.filter((item) => !records.some((old) => old.id === item.id))];
    cursor = page.cursor;
    render();
    if (reset) {
      selected = null;
      $("editor").hidden = true;
      const focus = new URLSearchParams(location.search).get(customer ? "s" : "page");
      if (focus && /^[A-Za-z0-9_-]{16}$/.test(focus)) {
        const item = await api(base + "/links/" + focus);
        if (current === session) await edit(item);
      } else if (customer && records.length === 1 && !cursor) await edit(records[0]);
    }
  } catch (error) {
    $("list-status").textContent = error.message;
  } finally {
    busy = false;
    $("refresh").disabled = false;
    $("more").disabled = false;
  }
}
async function login(token) {
  credential = token;
  const current = ++session;
  $("login-status").textContent = "Mengesahkan akaun Google\u2026";
  try {
    const actor = await api(base + "/self");
    if (current !== session) return;
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => logout("Sesi tamat. Log masuk semula."), Math.max(0, actor.expiresAt - Date.now()));
    $("identity").textContent = actor.email;
    $("login-panel").hidden = true;
    $("dashboard").hidden = false;
    alerts?.start();
    await load(true);
  } catch (error) {
    credential = "";
    $("login-status").textContent = error.message;
  }
}
async function edit(item) {
  if (saving) return;
  coverPreview.hidden = !item.profile.cover;
  if (item.profile.cover) coverPreview.src = item.profile.cover;
  coverStatus.textContent = "";
  selected = item;
  $("edit-title").textContent = item.profile.name;
  $("share").value = item.url;
  $("open").href = item.url;
  $("copy-status").textContent = "";
  $("save-status").textContent = "";
  if ($("public-sharing")) $("public-sharing").hidden = item.state === "nfc_only" || item.state === "deleted";
  for (const field of Object.keys(fields)) $("field-" + field).value = item.profile[field] || (field === "theme" ? "classic" : field === "accent" ? "#20543e" : "");
  listingTools?.set(item.profile);
  if (customer) {
    $("field-google").required = item.profile.googleStatus !== "pending";
    $("field-google").readOnly = item.profile.googleStatus === "pending";
    $("google-pending-note").hidden = item.profile.googleStatus !== "pending";
  }
  if ($("owner-email")) {
    $("owner-email").value = item.ownerEmail || "";
    $("owner-status").textContent = item.ownerEmail ? "Pemilik boleh login di tap.imai.my/edit dengan Gmail ini." : "Daftarkan Gmail supaya pelanggan boleh menyunting halaman ini.";
  }
  $("editor").hidden = false;
  $("download").removeAttribute("href");
  $("qr").removeAttribute("src");
  try {
    const png = await import_qrcode.default.toDataURL(item.url, { width: 1024, margin: 4, errorCorrectionLevel: "M", color: { dark: "#173b33", light: "#ffffff" } });
    if (selected?.id === item.id) {
      $("qr").src = png;
      $("download").href = png;
    }
  } catch {
    $("copy-status").textContent = "QR belum dapat disediakan. URL pelanggan masih sama.";
  }
  if (!customer) $("editor").scrollIntoView({ behavior: "smooth", block: "start" });
  lockControls(false);
  await management.show(item);
  ordersUI.show(item);
  customerArea?.update(item);
}
for (const [key, text] of Object.entries(fields)) {
  const label = document.createElement("label");
  label.htmlFor = "field-" + key;
  label.textContent = text + (["name", "google"].includes(key) ? " *" : "");
  const spec = appearanceFields[key];
  const input = document.createElement(spec?.options ? "select" : "input");
  input.id = "field-" + key;
  input.name = key;
  input.maxLength = spec?.max || (key === "name" ? 80 : key === "tagline" ? 140 : key === "phone" ? 30 : 500);
  if (spec?.options) for (const [value, text2] of Object.entries(spec.options)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text2;
    input.append(option);
  }
  if (["name", "google"].includes(key)) input.required = true;
  if (!spec && !["name", "tagline", "phone"].includes(key)) {
    input.type = "url";
    input.placeholder = "https://";
  }
  if (spec && !spec.options) {
    input.type = spec.type || "text";
    if (spec.type === "url") input.placeholder = "https://";
  }
  if (key === "cover") {
    input.readOnly = true;
    input.type = "hidden";
    label.hidden = true;
  }
  if (key === "phone") {
    input.type = "tel";
    input.addEventListener("input", () => {
      const link = whatsappFromPhone(input.value);
      if (link) $("field-whatsapp").value = link;
    });
  }
  if (key === "theme") input.addEventListener("change", () => {
    $("field-accent").value = { classic: "#20543e", dark: "#91c8ad", bright: "#7040bb" }[input.value];
  });
  input.addEventListener("input", () => {
    $("save-status").textContent = "Ada perubahan yang belum disimpan.";
  });
  $("fields").append(label, input);
}
if (!customer) {
  listingTools = createGoogleListingTools({ input: $("field-google"), name: () => $("field-name").value, onChange: () => {
    $("save-status").textContent = "Ada perubahan yang belum disimpan.";
  }, search: (query) => api("/api/admin/search", { method: "POST", body: { query } }), lookup: (token) => api("/api/admin/import", { method: "POST", body: { token } }) });
  $("edit-form").prepend(listingTools.panel);
} else {
  const note = document.createElement("p");
  note.id = "google-pending-note";
  note.className = "notice";
  note.textContent = "Google Review belum tersedia. Hubungi super admin untuk menyambungkan lokasi apabila tersedia di Google Maps.";
  note.hidden = true;
  $("field-google").after(note);
}
var coverLabel = document.createElement("label");
coverLabel.htmlFor = "cover-file";
coverLabel.textContent = "Muat naik cover daripada peranti";
var coverFile = document.createElement("input");
coverFile.id = "cover-file";
coverFile.type = "file";
coverFile.accept = "image/jpeg,image/png,image/webp";
var coverHelp = document.createElement("p");
coverHelp.className = "help";
coverHelp.textContent = "JPG, PNG atau WebP. Had asal 5 MB / 25 megapiksel. Pelayan mengecilkan kepada maksimum 1600 piksel dan 500 KB. Cover disimpan terus; maklumat lain gunakan butang Simpan.";
var coverStatus = document.createElement("p");
coverStatus.setAttribute("role", "status");
var coverPreview = document.createElement("img");
coverPreview.className = "cover-upload-preview";
coverPreview.alt = "Pratonton cover pilihan";
coverPreview.hidden = true;
var removeCover = document.createElement("button");
removeCover.type = "button";
removeCover.id = "remove-cover";
removeCover.className = "secondary";
removeCover.textContent = "Guna latar tema tanpa cover";
removeCover.addEventListener("click", () => {
  $("field-cover").value = "";
  coverPreview.hidden = true;
  coverStatus.textContent = "Tekan Simpan untuk membuang cover dan menggunakan latar tema.";
});
$("field-cover").after(coverLabel, coverFile, coverHelp, coverPreview, removeCover, coverStatus);
var previewURL;
coverFile.addEventListener("change", async () => {
  const file = coverFile.files[0];
  if (!file || !selected || saving) return;
  if (file.size > 5 * 1024 * 1024) {
    coverStatus.textContent = "Gambar melebihi 5 MB. Pilih fail lebih kecil.";
    coverFile.value = "";
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    coverStatus.textContent = "Gunakan JPG, PNG atau WebP.";
    return;
  }
  const item = selected, current = session;
  lockControls(true);
  coverFile.disabled = true;
  coverStatus.textContent = "Memproses dan menyimpan cover\u2026";
  try {
    const response = await fetch(new URL(base + "/links/" + item.id + "/cover", endpoint), { method: "POST", headers: { Authorization: "Bearer " + credential, "Content-Type": file.type, "If-Match": item.revision }, body: file, credentials: "omit", cache: "no-store" });
    const updated = await response.json();
    if (!response.ok) throw new Error(updated.error || "Cover belum dapat disimpan.");
    if (current !== session || selected?.id !== item.id) return;
    selected = updated;
    records = records.map((record) => record.id === updated.id ? updated : record);
    render();
    $("field-cover").value = updated.profile.cover;
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);
    coverPreview.src = previewURL;
    coverPreview.hidden = false;
    coverStatus.textContent = "Cover telah disimpan. URL pendek dan QR kekal sama.";
  } catch (error) {
    coverStatus.textContent = error.message;
  } finally {
    lockControls(false);
    coverFile.value = "";
  }
});
$("edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selected) return;
  const item = selected, current = session;
  const profile = { v: 1 };
  for (const key of Object.keys(fields)) profile[key] = $("field-" + key).value.normalize("NFC").trim();
  listingTools?.apply(profile);
  if (customer && item.profile.googleStatus === "pending") {
    profile.google = "";
    profile.googleStatus = "pending";
  }
  if (malaysiaPhone(profile.phone)) profile.phone = malaysiaPhone(profile.phone);
  listingTools?.lock(true);
  saving = true;
  $("save").disabled = true;
  $("cancel").disabled = true;
  $("refresh").disabled = true;
  $("more").disabled = true;
  if ($("save-owner")) $("save-owner").disabled = true;
  for (const field of Object.keys(fields)) $("field-" + field).disabled = true;
  $("save-status").textContent = "Menyimpan pada URL yang sama\u2026";
  try {
    const updated = await api(base + "/links/" + item.id, { method: "PUT", body: { profile, revision: item.revision } });
    if (current !== session) return;
    records = records.map((record) => record.id === updated.id ? updated : record);
    selected = updated;
    render();
    customerArea?.update(updated);
    $("edit-title").textContent = updated.profile.name;
    for (const key of Object.keys(fields)) $("field-" + key).value = updated.profile[key] || (key === "theme" ? "classic" : key === "accent" ? "#20543e" : "");
    listingTools?.set(updated.profile);
    $("save-status").textContent = "Berjaya disimpan. URL dan QR pelanggan kekal sama. Buka semula halaman untuk melihat perubahan.";
  } catch (error) {
    $("save-status").textContent = error.message + (error.status === 409 ? " Salin perubahan anda sebelum memuat semula senarai." : "");
  } finally {
    saving = false;
    $("save").disabled = false;
    $("cancel").disabled = false;
    $("refresh").disabled = false;
    $("more").disabled = false;
    if ($("save-owner")) $("save-owner").disabled = false;
    for (const field of Object.keys(fields)) $("field-" + field).disabled = false;
    listingTools?.lock(false);
  }
});
$("owner-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selected || saving) return;
  const item = selected, current = session;
  const email = $("owner-email").value.trim().toLowerCase();
  saving = true;
  for (const id of ["save", "cancel", "refresh", "more", "save-owner", "owner-email"]) $(id).disabled = true;
  $("owner-status").textContent = "Mendaftarkan Gmail pemilik\u2026";
  try {
    const updated = await api(base + "/links/" + item.id + "/owner", { method: "PUT", body: { email, revision: item.revision } });
    if (current !== session) return;
    selected = updated;
    records = records.map((record) => record.id === updated.id ? updated : record);
    render();
    $("owner-email").value = updated.ownerEmail;
    $("owner-status").textContent = "Gmail didaftarkan. Pemilik boleh login di tap.imai.my/edit. URL dan QR kekal sama.";
  } catch (error) {
    $("owner-status").textContent = error.message;
  } finally {
    saving = false;
    for (const id of ["save", "cancel", "refresh", "more", "save-owner", "owner-email"]) $(id).disabled = false;
  }
});
$("filter").addEventListener("input", render);
$("refresh").addEventListener("click", () => {
  load(true);
  alerts?.refresh();
});
$("more").addEventListener("click", () => load());
$("cancel").addEventListener("click", () => {
  if (customerArea) {
    customerArea.open("my");
    return;
  }
  selected = null;
  $("editor").hidden = true;
});
$("logout").addEventListener("click", () => logout());
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("share").value);
    $("copy-status").textContent = "Pautan disalin.";
  } catch {
    $("share").focus();
    $("share").select();
    $("copy-status").textContent = "Pilih dan salin pautan secara manual.";
  }
});
if (customer) customerArea = createCustomerArea({ coverNodes: [coverLabel, coverFile, coverHelp, coverPreview, removeCover, coverStatus], onSelect: async (id) => {
  if (saving) return;
  try {
    await edit(await api(base + "/links/" + id));
  } catch (error) {
    $("list-status").textContent = error.message;
  }
} });
try {
  const config = await api(base + "/config", { authenticated: false });
  if (config.demo && location.hostname === "127.0.0.1") {
    $("demo").hidden = false;
    $("demo-login").hidden = false;
    $("login-status").textContent = "Demo hanya pada komputer ini.";
    $("demo-login").addEventListener("click", () => login("localhost-demo"));
  } else if (!config.configured || !config.clientId) {
    $("login-status").textContent = "Login Google belum diaktifkan oleh pemilik SmartTap. Rekod kekal dilindungi.";
  } else {
    $("login-status").textContent = customer ? "Log masuk menggunakan Gmail yang didaftarkan oleh super admin." : "Pilih akaun Google super admin untuk teruskan.";
    googleLogin({ clientId: config.clientId, container: $("google-login"), onCredential: login, onError: (message) => $("login-status").textContent = message, prompt: customer });
  }
} catch (error) {
  $("login-status").textContent = error.message;
}
