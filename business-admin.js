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
    function renderCanvas(renderFunc, canvas, text2, opts, cb) {
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
          cb = text2;
          text2 = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text2;
            text2 = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text2 = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text2;
          text2 = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text2, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text2, opts);
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

// import-service/service-catalog-schema.mjs
var catalogTemplates = {
  food: { ms: "Restoran / kafe", en: "Restaurant / cafe", categories: ["Hidangan utama", "Minuman", "Pencuci mulut"], english: ["Main dishes", "Drinks", "Desserts"], button: ["Lihat menu", "View menu"] },
  automotive: { ms: "Kedai tayar / bengkel", en: "Tyre shop / workshop", categories: ["Tayar", "Servis kenderaan", "Baik pulih", "Aksesori"], english: ["Tyres", "Vehicle service", "Repairs", "Accessories"], button: ["Lihat servis", "View services"] },
  legal: { ms: "Firma guaman", en: "Law firm", categories: ["Hartanah", "Korporat", "Keluarga", "Perundingan"], english: ["Property", "Corporate", "Family", "Consultation"], button: ["Perkhidmatan guaman", "Legal services"] },
  salon: { ms: "Salon / kecantikan", en: "Salon / beauty", categories: ["Rambut", "Rawatan", "Pakej"], english: ["Hair", "Treatments", "Packages"], button: ["Lihat rawatan", "View treatments"] },
  cleaning: { ms: "Servis pembersihan", en: "Cleaning services", categories: ["Rumah", "Pejabat", "Cucian khusus"], english: ["Home", "Office", "Specialist cleaning"], button: ["Lihat servis", "View services"] },
  contractor: { ms: "Kontraktor / penyelenggaraan", en: "Contractor / maintenance", categories: ["Renovasi", "Elektrik", "Paip", "Pembaikan"], english: ["Renovation", "Electrical", "Plumbing", "Repairs"], button: ["Lihat perkhidmatan", "View services"] },
  education: { ms: "Kelas / tuisyen", en: "Classes / tuition", categories: ["Kelas", "Subjek", "Pakej"], english: ["Classes", "Subjects", "Packages"], button: ["Lihat kelas", "View classes"] },
  retail: { ms: "Kedai / produk", en: "Shop / products", categories: ["Produk", "Koleksi", "Aksesori"], english: ["Products", "Collections", "Accessories"], button: ["Lihat katalog", "View catalogue"] },
  professional: { ms: "Perkhidmatan profesional", en: "Professional services", categories: ["Perakaunan", "Reka bentuk", "Perundingan"], english: ["Accounting", "Design", "Consultation"], button: ["Lihat perkhidmatan", "View services"] },
  clinic: { ms: "Klinik / pergigian", en: "Clinic / dental", categories: ["Pemeriksaan", "Perkhidmatan", "Temujanji"], english: ["Check-ups", "Services", "Appointments"], button: ["Lihat perkhidmatan", "View services"] },
  property: { ms: "Hartanah / penginapan", en: "Property / accommodation", categories: ["Sewaan", "Penginapan", "Pakej"], english: ["Rentals", "Accommodation", "Packages"], button: ["Lihat pilihan", "View options"] },
  events: { ms: "Fotografi / acara", en: "Photography / events", categories: ["Fotografi", "Videografi", "Pakej acara"], english: ["Photography", "Videography", "Event packages"], button: ["Lihat pakej", "View packages"] },
  custom: { ms: "Tersuai / lain-lain", en: "Custom / other", categories: ["Produk", "Perkhidmatan", "Pakej"], english: ["Products", "Services", "Packages"], button: ["Lihat katalog", "View catalogue"] }
};
var catalogUnits = { "": ["Sekali / tanpa unit", "One-off / no unit"], unit: ["Seunit", "Per unit"], hour: ["Sejam", "Per hour"], session: ["Sesi", "Per session"], day: ["Sehari", "Per day"], night: ["Semalam", "Per night"], month: ["Sebulan", "Per month"], project: ["Projek", "Per project"] };
var MAX_CATALOG_ITEMS = 50;
var catalogURL = (origin, id) => origin + "/menu/?s=" + id;
var fail = (text2) => Object.assign(new Error(text2), { status: 400 });
function text(value, max, required = false) {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw fail("Teks katalog tidak sah.");
  const result = value.normalize("NFC").trim();
  if (result.length > max || required && !result) throw fail("Lengkapkan nama dan kategori item.");
  return result;
}
function validateServiceCatalog(value, { id, mediaOrigin }) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !["v", "enabled", "kind", "items"].includes(key)) || value.v !== 1 || typeof value.enabled !== "boolean" || !Object.hasOwn(catalogTemplates, value.kind) || !Array.isArray(value.items) || value.items.length > MAX_CATALOG_ITEMS) throw fail("Katalog tidak sah. Had maksimum 50 item.");
  if (value.enabled && !value.items.length) throw fail("Tambah sekurang-kurangnya satu item untuk menerbitkan katalog.");
  const ids = /* @__PURE__ */ new Set(), items = value.items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).some((key) => !["id", "name", "category", "description", "priceMode", "priceCents", "unit", "status", "photo"].includes(key)) || !/^\b[a-f0-9]{16}$/.test(item.id || "") || ids.has(item.id)) throw fail("Item katalog tidak sah atau berulang.");
    ids.add(item.id);
    if (!["fixed", "from", "quote", "free"].includes(item.priceMode) || !["available", "unavailable", "hidden"].includes(item.status) || !Object.hasOwn(catalogUnits, item.unit)) throw fail("Pilihan harga atau status tidak sah.");
    const priced = ["fixed", "from"].includes(item.priceMode);
    if (priced ? !Number.isSafeInteger(item.priceCents) || item.priceCents < 0 || item.priceCents > 1e8 : item.priceCents !== null || item.unit !== "") throw fail("Harga katalog tidak sah.");
    const photo = text(item.photo, 500);
    if (photo) {
      const expected = mediaOrigin + "/api/catalog-media/" + id + "/";
      if (!photo.startsWith(expected) || !new RegExp("^[a-f0-9]{24}\\.webp$").test(photo.slice(expected.length))) throw fail("Gambar mesti dimuat naik untuk halaman ini.");
    }
    return { id: item.id, name: text(item.name, 80, true), category: text(item.category, 40, true), description: text(item.description, 300), priceMode: item.priceMode, priceCents: item.priceCents, unit: item.unit, status: item.status, photo };
  });
  const catalog = { v: 1, enabled: value.enabled, kind: value.kind, items };
  if (new TextEncoder().encode(JSON.stringify(catalog)).length > 65e3) throw fail("Katalog terlalu besar. Ringkaskan maklumat item.");
  return catalog;
}
function catalogPrice(item, language = "ms") {
  const en = language === "en";
  if (item.priceMode === "quote") return en ? "Request a quote" : "Minta sebut harga";
  if (item.priceMode === "free") return en ? "Free" : "Percuma";
  const money3 = "RM" + (item.priceCents / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const suffix = { unit: en ? "unit" : "unit", hour: en ? "hour" : "jam", session: en ? "session" : "sesi", day: en ? "day" : "hari", night: en ? "night" : "malam", month: en ? "month" : "bulan", project: en ? "project" : "projek" }[item.unit];
  return (item.priceMode === "from" ? en ? "From " : "Bermula " : "") + money3 + (suffix ? " / " + suffix : "");
}
function parseCatalogPrice(value) {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(String(value))) throw fail("Masukkan harga yang sah, maksimum dua tempat perpuluhan.");
  const [whole, decimal = ""] = String(value).split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  if (cents > 1e8) throw fail("Harga melebihi had katalog.");
  return cents;
}

// src/catalog-editor.mjs
function createCatalogEditor({ onChange, upload, loadImage }) {
  const $2 = (id) => document.getElementById(id), mode = $2("appearance-menu-mode"), menu = $2("field-menu"), buttonLabel = $2("field-menuLabel"), host = menu.closest(".appearance-control");
  let language = document.documentElement.lang === "en" ? "en" : "ms", selected2 = null, data = { v: 1, enabled: false, kind: "custom", items: [] }, locked = false, uploading = false, active = null, photo = "", previewURL2 = "", request = 0, page = 0, tab = 0;
  try {
    if (localStorage.getItem("smarttap.language") === "en") language = "en";
  } catch {
  }
  const L = (ms, en) => language === "en" ? en : ms, copyNodes = [];
  const el = (tag, cls, text2) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text2) n.textContent = text2;
    return n;
  };
  function copy(node, ms, en, attr) {
    copyNodes.push({ node, ms, en, attr });
    if (attr) node.setAttribute(attr, L(ms, en));
    else node.textContent = L(ms, en);
    return node;
  }
  function button(ms, en, action, parent, cls = "secondary") {
    const b = copy(el("button", cls), ms, en);
    b.type = "button";
    b.onclick = action;
    parent.append(b);
    return b;
  }
  function field(parent, ms, en, input) {
    const box = el("div", "catalog-field"), label = copy(el("label"), ms, en);
    input.id ||= "catalog-input-" + copyNodes.length;
    label.htmlFor = input.id;
    box.append(label, input);
    parent.append(box);
    return box;
  }
  function option(select, value, ms, en) {
    const o = copy(el("option"), ms, en);
    o.value = value;
    select.append(o);
    return o;
  }
  copy([...mode.options].find((o) => o.value === "catalog"), "Bina menu / katalog", "Build menu / catalogue");
  [...mode.options].find((o) => o.value === "catalog").dataset.noI18n = "";
  const root = el("div", "catalog-editor");
  root.dataset.noI18n = "";
  host.append(root);
  const labelWrap = el("div", "catalog-label-field");
  const originalLabel = document.querySelector('label[for="field-menuLabel"]');
  labelWrap.append(originalLabel, buttonLabel);
  root.append(labelWrap);
  copy(originalLabel, "Nama butang menu / katalog", "Menu / catalogue button label");
  const builder = el("div", "catalog-builder");
  root.append(builder);
  const kind = el("select");
  kind.id = "catalog-kind";
  for (const [key, t] of Object.entries(catalogTemplates)) option(kind, key, t.ms, t.en);
  field(builder, "Jenis perniagaan", "Business type", kind);
  const toolbar = el("div", "catalog-toolbar"), count = el("span", "catalog-count");
  builder.append(toolbar);
  const add = button("+ Tambah item", "+ Add item", () => open(), toolbar);
  toolbar.append(count);
  const list = el("div", "catalog-editor-list");
  builder.append(list);
  const pages = el("div", "catalog-pagination");
  builder.append(pages);
  const previous = button("\u2190 Sebelum", "\u2190 Previous", () => {
    page--;
    renderList();
  }, pages), pageText = el("span"), next = button("Seterusnya \u2192", "Next \u2192", () => {
    page++;
    renderList();
  }, pages);
  pages.insertBefore(pageText, next);
  const hint = copy(el("p", "help"), "Had 50 item. Sunting senarai dahulu, kemudian tekan Simpan pada URL yang sama.", "Up to 50 items. Edit the list, then save it on the same URL.");
  builder.append(hint);
  const dialog = el("dialog", "catalog-item-dialog");
  dialog.id = "catalog-item-dialog";
  dialog.dataset.noI18n = "";
  dialog.setAttribute("aria-labelledby", "catalog-dialog-title");
  const top = el("div", "catalog-dialog-top"), title = el("h2");
  title.id = "catalog-dialog-title";
  top.append(title);
  const close = button("Tutup \xD7", "Close \xD7", () => dialog.close(), top);
  dialog.append(top);
  const tabs = el("nav", "customer-subnav");
  tabs.setAttribute("aria-label", "Item sections");
  dialog.append(tabs);
  const info = el("div", "catalog-dialog-fields"), pricing = el("div", "catalog-dialog-fields");
  dialog.append(info, pricing);
  const tabButtons = [button("Maklumat item", "Item details", () => showTab(0), tabs), button("Harga & gambar", "Price & photo", () => showTab(1), tabs)];
  const name = el("input");
  name.id = "catalog-item-name";
  name.maxLength = 80;
  name.required = true;
  field(info, "Nama produk / servis", "Product / service name", name);
  const category = el("select");
  category.id = "catalog-item-category";
  field(info, "Kategori", "Category", category);
  const customCategory = el("input");
  customCategory.id = "catalog-item-custom-category";
  customCategory.maxLength = 40;
  const customBox = field(info, "Kategori sendiri", "Custom category", customCategory);
  const description = el("textarea");
  description.id = "catalog-item-description";
  description.rows = 3;
  description.maxLength = 300;
  field(info, "Penerangan ringkas (pilihan)", "Short description (optional)", description);
  const state = el("select");
  state.id = "catalog-item-state";
  for (const [v, ms, en] of [["available", "Tersedia", "Available"], ["unavailable", "Tidak tersedia sementara", "Temporarily unavailable"], ["hidden", "Sembunyikan", "Hidden"]]) option(state, v, ms, en);
  field(info, "Status item", "Item status", state);
  const priceMode = el("select");
  priceMode.id = "catalog-item-price-mode";
  for (const [v, ms, en] of [["fixed", "Harga tetap", "Fixed price"], ["from", "Bermula dari", "Starting from"], ["quote", "Minta sebut harga", "Request a quote"], ["free", "Percuma", "Free"]]) option(priceMode, v, ms, en);
  field(pricing, "Jenis harga", "Price type", priceMode);
  const amount = el("input");
  amount.id = "catalog-item-price";
  amount.type = "number";
  amount.min = "0";
  amount.max = "1000000";
  amount.step = "0.01";
  amount.inputMode = "decimal";
  const amountBox = field(pricing, "Harga (RM)", "Price (RM)", amount);
  const unit = el("select");
  unit.id = "catalog-item-unit";
  for (const [value, [ms, en]] of Object.entries(catalogUnits)) option(unit, value, ms, en);
  const unitBox = field(pricing, "Unit harga", "Pricing unit", unit);
  const file = el("input");
  file.id = "catalog-item-file";
  file.type = "file";
  file.accept = "image/jpeg,image/png,image/webp";
  field(pricing, "Gambar item (pilihan)", "Item photo (optional)", file);
  const preview = el("img", "catalog-item-preview");
  preview.alt = "Item preview";
  preview.hidden = true;
  pricing.append(preview);
  const remove = button("Buang gambar", "Remove photo", () => {
    photo = "";
    revoke();
    preview.hidden = true;
    remove.hidden = true;
  }, pricing);
  pricing.append(copy(el("p", "help"), "JPG, PNG atau WebP, maksimum 2 MB. Gambar dikecilkan kepada 800 piksel / 200 KB. Gambar diterbitkan selepas senarai disimpan.", "JPG, PNG or WebP, up to 2 MB. Images are optimised to 800 pixels / 200 KB and published after the list is saved."));
  const status = el("p", "catalog-item-status");
  status.setAttribute("role", "status");
  dialog.append(status);
  const actions = el("div", "actions");
  dialog.append(actions);
  const done = button("Masukkan ke senarai", "Apply to list", () => commit(), actions, "");
  button("Batal", "Cancel", () => dialog.close(), actions);
  document.body.append(dialog);
  const settings = el("div", "catalog-settings"), catalogTabs = el("nav", "customer-subnav catalog-mode-tabs");
  catalogTabs.setAttribute("aria-label", "Catalogue sections");
  root.prepend(catalogTabs, settings);
  for (const node of [...host.children]) if (node !== root) settings.append(node);
  const kindField = kind.closest(".catalog-field");
  settings.append(labelWrap, kindField);
  root.insertBefore(toolbar, builder);
  root.dataset.catalogTab = "settings";
  const tabChoices = [button("Tetapan", "Settings", () => switchView("settings"), catalogTabs), button("Senarai item", "Item list", () => switchView("items"), catalogTabs)];
  function switchView(value) {
    root.dataset.catalogTab = value;
    tabChoices.forEach((b, i) => b.setAttribute("aria-current", (i === 0 ? "settings" : "items") === value ? "page" : "false"));
  }
  const modeLabel = document.querySelector('label[for="appearance-menu-mode"]');
  copy(modeLabel, "Jenis menu / katalog", "Menu / catalogue type");
  for (const [value, ms, en] of [["none", "Tidak dipaparkan", "Not displayed"], ["link", "Pautan HTTPS", "HTTPS link"]]) copy([...mode.options].find((o) => o.value === value), ms, en);
  const mobile = matchMedia("(max-width:700px)"), pageSize = () => mobile.matches ? 2 : 3;
  mobile.addEventListener("change", () => renderList());
  const controls = [...root.querySelectorAll("button,select,input"), ...dialog.querySelectorAll("button,select,input,textarea")];
  function revoke() {
    if (previewURL2) {
      URL.revokeObjectURL(previewURL2);
      previewURL2 = "";
    }
  }
  dialog.addEventListener("close", () => {
    request++;
    revoke();
    active = null;
    file.value = "";
  });
  dialog.addEventListener("cancel", (event) => {
    if (uploading) event.preventDefault();
  });
  function showTab(index) {
    tab = index;
    info.hidden = index !== 0;
    pricing.hidden = index !== 1;
    tabButtons.forEach((b, i) => b.setAttribute("aria-current", i === index ? "page" : "false"));
  }
  function permissions() {
    const unavailable = locked || uploading;
    for (const control of controls) control.disabled = unavailable;
    for (const control of builder.querySelectorAll("input,select,button")) control.disabled = unavailable || mode.value !== "catalog";
    buttonLabel.disabled = unavailable || mode.value === "none";
    const priced = ["fixed", "from"].includes(priceMode.value);
    amountBox.hidden = unitBox.hidden = !priced;
    amount.disabled = unit.disabled = unavailable || !priced;
    amount.required = priced;
    customBox.hidden = category.value !== "__custom";
    customCategory.disabled = unavailable || customBox.hidden;
    customCategory.required = !customBox.hidden;
    previous.disabled = unavailable || page === 0;
    next.disabled = unavailable || (page + 1) * pageSize() >= data.items.length;
    add.disabled = unavailable || data.items.length >= 50;
  }
  function renderList() {
    list.replaceChildren();
    page = Math.max(0, Math.min(page, Math.max(0, Math.ceil(data.items.length / pageSize()) - 1)));
    count.textContent = data.items.length + " / 50";
    for (const item of data.items.slice(page * pageSize(), page * pageSize() + pageSize())) {
      const row = el("article", "catalog-editor-row"), text2 = el("div"), heading = el("strong", null, item.name), meta = el("p", null, item.category + " \xB7 " + catalogPrice(item, language) + (item.status === "hidden" ? L(" \xB7 Tersembunyi", " \xB7 Hidden") : item.status === "unavailable" ? L(" \xB7 Tidak tersedia", " \xB7 Unavailable") : ""));
      text2.append(heading, meta);
      row.append(text2);
      const buttons = el("div", "catalog-row-actions");
      row.append(buttons);
      const edit2 = el("button", "secondary", L("Sunting", "Edit"));
      edit2.type = "button";
      edit2.onclick = () => open(item);
      edit2.disabled = locked;
      buttons.append(edit2);
      for (const [label, delta] of [["\u2191", -1], ["\u2193", 1]]) {
        const b = el("button", "secondary", label);
        b.type = "button";
        b.setAttribute("aria-label", L(delta < 0 ? "Naik" : "Turun", delta < 0 ? "Move up" : "Move down") + " " + item.name);
        const at = data.items.indexOf(item);
        b.disabled = locked || at + delta < 0 || at + delta >= data.items.length;
        b.onclick = () => {
          [data.items[at], data.items[at + delta]] = [data.items[at + delta], data.items[at]];
          page = Math.floor((at + delta) / pageSize());
          renderList();
          onChange();
        };
        buttons.append(b);
      }
      const del = el("button", "secondary", L("Padam", "Delete"));
      del.type = "button";
      del.disabled = locked;
      del.onclick = () => {
        if (confirm(L("Padam item ini daripada draf? Perubahan berkuat kuasa selepas Simpan.", "Remove this item from the draft? Save to apply the change."))) {
          data.items = data.items.filter((x) => x.id !== item.id);
          renderList();
          onChange();
        }
      };
      buttons.append(del);
      list.append(row);
    }
    if (!data.items.length) list.append(el("p", "help", L("Belum ada item. Tekan + Tambah item untuk bermula.", "No items yet. Select + Add item to begin.")));
    pages.hidden = data.items.length <= pageSize();
    pageText.textContent = page + 1 + " / " + Math.max(1, Math.ceil(data.items.length / pageSize()));
    permissions();
  }
  function renderMode() {
    builder.hidden = toolbar.hidden = catalogTabs.hidden = kindField.hidden = mode.value !== "catalog";
    if (mode.value !== "catalog") switchView("settings");
    labelWrap.hidden = mode.value === "none";
    if (mode.value === "catalog" && selected2) {
      menu.value = catalogURL(location.origin, selected2.id);
      if (!buttonLabel.value) buttonLabel.value = catalogTemplates[data.kind].button[language === "en" ? 1 : 0];
    }
    permissions();
  }
  mode.addEventListener("change", () => {
    renderMode();
    onChange();
  });
  kind.onchange = () => {
    data.kind = kind.value;
    const template = catalogTemplates[data.kind];
    buttonLabel.value = template.button[language === "en" ? 1 : 0];
    renderList();
    onChange();
  };
  category.onchange = permissions;
  priceMode.onchange = permissions;
  async function open(item) {
    if (locked) return;
    active = item?.id || crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    title.textContent = item ? L("Sunting item", "Edit item") : L("Tambah item", "Add item");
    name.value = item?.name || "";
    description.value = item?.description || "";
    state.value = item?.status || "available";
    priceMode.value = item?.priceMode || "fixed";
    amount.value = item?.priceCents === null ? "" : item?.priceCents !== void 0 ? (item.priceCents / 100).toFixed(2) : "";
    unit.value = item?.unit || "";
    photo = item?.photo || "";
    status.textContent = "";
    file.value = "";
    preview.hidden = true;
    remove.hidden = !photo;
    category.replaceChildren();
    const t = catalogTemplates[data.kind], choices = [.../* @__PURE__ */ new Set([...language === "en" ? t.english : t.categories, ...data.items.map((x) => x.category)])];
    for (const text2 of choices) {
      const o = el("option", null, text2);
      o.value = text2;
      category.append(o);
    }
    const custom = el("option", null, L("+ Kategori sendiri", "+ Custom category"));
    custom.value = "__custom";
    category.append(custom);
    category.value = item?.category || choices[0];
    customCategory.value = "";
    showTab(0);
    permissions();
    dialog.showModal();
    name.focus();
    const thisRequest = ++request;
    if (photo) {
      try {
        const blob = await loadImage(photo);
        if (thisRequest !== request) return;
        revoke();
        previewURL2 = URL.createObjectURL(blob);
        preview.src = previewURL2;
        preview.hidden = false;
      } catch {
        if (thisRequest === request) status.textContent = L("Gambar belum dapat dipratonton. Anda boleh menggantikannya.", "Photo preview is unavailable. You can replace it.");
      }
    }
  }
  function commit() {
    if (locked || uploading) return;
    for (const control of [name, customCategory, amount]) if (!control.disabled && !control.checkValidity()) {
      showTab(pricing.contains(control) ? 1 : 0);
      control.focus();
      control.reportValidity();
      return;
    }
    try {
      const priced = ["fixed", "from"].includes(priceMode.value), item = { id: active, name: name.value.trim(), category: (category.value === "__custom" ? customCategory.value : category.value).trim(), description: description.value.trim(), priceMode: priceMode.value, priceCents: priced ? parseCatalogPrice(amount.value) : null, unit: priced ? unit.value : "", status: state.value, photo };
      const at = data.items.findIndex((x) => x.id === active), items = data.items.slice();
      if (at < 0) items.push(item);
      else items[at] = item;
      validateServiceCatalog({ ...data, enabled: true, items }, { id: selected2.id, mediaOrigin: selected2.mediaOrigin });
      data.items = items;
      page = Math.floor((at < 0 ? items.length - 1 : at) / pageSize());
      dialog.close();
      switchView("items");
      renderList();
      onChange();
    } catch (error) {
      status.textContent = error.message;
    }
  }
  file.onchange = async () => {
    const chosen = file.files[0];
    if (!chosen || uploading) return;
    if (chosen.size > 2 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(chosen.type)) {
      status.textContent = L("Pilih JPG, PNG atau WebP sehingga 2 MB.", "Choose JPG, PNG or WebP up to 2 MB.");
      file.value = "";
      return;
    }
    const current = ++request;
    uploading = true;
    status.textContent = L("Memproses gambar\u2026", "Processing photo\u2026");
    permissions();
    try {
      const result = await upload(chosen);
      if (current !== request) return;
      photo = result.url;
      revoke();
      previewURL2 = URL.createObjectURL(chosen);
      preview.src = previewURL2;
      preview.hidden = false;
      remove.hidden = false;
      status.textContent = L("Gambar siap. Masukkan item ke senarai dan Simpan untuk menerbitkannya.", "Photo ready. Apply the item to the list and save to publish it.");
    } catch (error) {
      if (current === request) status.textContent = error.message;
    } finally {
      uploading = false;
      file.value = "";
      permissions();
    }
  };
  window.addEventListener("smarttap:language", (event) => {
    language = event.detail.language === "en" ? "en" : "ms";
    for (const { node, ms, en, attr } of copyNodes) {
      if (attr) node.setAttribute(attr, L(ms, en));
      else node.textContent = L(ms, en);
    }
    renderList();
  });
  return { set(item) {
    request++;
    if (dialog.open) dialog.close();
    selected2 = { id: item.id, mediaOrigin: item.mediaOrigin };
    data = structuredClone(item.catalog || { v: 1, enabled: false, kind: "custom", items: [] });
    kind.value = data.kind;
    page = 0;
    switchView(data.items.length ? "items" : "settings");
    renderMode();
    renderList();
  }, draft() {
    if (!selected2) return void 0;
    const value = { ...data, enabled: mode.value === "catalog", kind: kind.value };
    return validateServiceCatalog(value, { id: selected2.id, mediaOrigin: selected2.mediaOrigin });
  }, lock(value) {
    locked = value;
    renderList();
  }, clear() {
    request++;
    if (dialog.open) dialog.close();
    selected2 = null;
    data = { v: 1, enabled: false, kind: "custom", items: [] };
    list.replaceChildren();
    revoke();
  }, panel: root };
}

// src/appearance-controls-values.mjs
function safeAppearanceURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
function mapsAddressURL(address) {
  return address.trim() ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(address.trim()) : "";
}
function malaysiaDateTime(now = Date.now()) {
  return new Date(now + 8 * 36e5).toISOString().slice(0, 16);
}
function promotionRange(days2, now = Date.now()) {
  return { promoStart: malaysiaDateTime(now), promoEnd: malaysiaDateTime(now + days2 * 864e5) };
}
function promotionState(profile, now = Date.now()) {
  if (!profile.promoTitle?.trim()) return "empty";
  const start = profile.promoStart ? Date.parse(profile.promoStart + "+08:00") : -Infinity;
  const end = profile.promoEnd ? Date.parse(profile.promoEnd + "+08:00") : Infinity;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "invalid";
  return now < start ? "scheduled" : now >= end ? "expired" : "active";
}

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

// src/appearance-controls-ui.mjs
function createAppearanceControls({ onChange }) {
  const message = (ms, en) => document.documentElement.lang === "en" ? en : ms;
  const $2 = (key) => document.getElementById("field-" + key), nodes = {}, controls = [];
  let locked = false;
  const el = (tag, cls, text2) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text2) n.textContent = text2;
    return n;
  };
  function wrap(key) {
    const box = el("div", "appearance-control");
    $2(key).before(box);
    box.append($2(key));
    nodes[key] = [box];
    return box;
  }
  function select(box, id, label, options) {
    const l = el("label", "", label), s = el("select");
    s.id = id;
    l.htmlFor = id;
    for (const [value, text2] of options) {
      const o = el("option", "", text2);
      o.value = value;
      s.append(o);
    }
    box.prepend(l, s);
    controls.push(s);
    return s;
  }
  function button(text2, action, box, cls = "secondary") {
    const b = el("button", cls, text2);
    b.type = "button";
    b.onclick = action;
    controls.push(b);
    box.append(b);
    return b;
  }
  function help(box, text2) {
    const p = el("p", "help", text2);
    box.append(p);
    return p;
  }
  function changed() {
    refresh();
    onChange();
  }
  const themeBox = wrap("theme"), accentBox = wrap("accent");
  const themeCards = el("div", "appearance-theme-cards");
  themeBox.append(themeCards);
  const themeOptions = [["classic", "Klasik", "#20543e"], ["dark", "Gelap", "#91c8ad"], ["bright", "Ceria", "#7040bb"]];
  for (const [value, text2, color] of themeOptions) {
    const b = button(text2, () => {
      $2("theme").value = value;
      $2("accent").value = color;
      changed();
    }, themeCards, "appearance-theme-card");
    b.dataset.theme = value;
    b.dataset.choice = value;
    const sample = el("span", "theme-card-sample");
    sample.setAttribute("aria-hidden", "true");
    b.prepend(sample);
  }
  const colorLine = el("div", "appearance-color-line");
  $2("accent").before(colorLine);
  colorLine.append($2("accent"));
  const hex = el("input");
  hex.id = "appearance-hex";
  hex.type = "text";
  hex.maxLength = 7;
  hex.pattern = "#[a-fA-F0-9]{6}";
  hex.setAttribute("aria-label", "Kod warna HEX");
  hex.dataset.noI18n = "";
  colorLine.append(hex);
  controls.push(hex);
  hex.oninput = () => {
    if (/^#[a-fA-F0-9]{6}$/.test(hex.value)) {
      $2("accent").value = hex.value;
      changed();
    }
  };
  hex.onblur = () => {
    if (!hex.checkValidity()) {
      hex.value = $2("accent").value;
    }
  };
  const swatches = el("div", "appearance-swatches");
  accentBox.append(swatches);
  for (const color of ["#20543e", "#193c70", "#7040bb", "#a33245", "#a45c13", "#111827"]) {
    const b = button(color, () => {
      $2("accent").value = color;
      changed();
    }, swatches, "appearance-swatch");
    b.style.backgroundColor = color;
    b.setAttribute("aria-label", color);
    b.title = color;
    b.dataset.color = color;
  }
  help(accentBox, "Pilih palet atau masukkan kod HEX. Warna butang digunakan pada halaman anda.");
  const themePreview = el("div", "appearance-theme-preview");
  themePreview.setAttribute("aria-label", "Pratonton tema");
  themeBox.append(themePreview);
  const previewName = el("strong"), previewText = el("span"), previewButton = el("span", "appearance-preview-button", "Contoh butang");
  previewName.dataset.noI18n = "";
  previewText.dataset.noI18n = "";
  themePreview.append(previewName, previewText, previewButton);
  const resetters = [];
  function linkEditor(key, label, { address = false, whatsapp = false } = {}) {
    const box = wrap(key), input = $2(key);
    let draft = "";
    const options = [["none", "Tidak dipaparkan"], ["link", "Pautan HTTPS"]];
    if (key === "menu") options.push(["catalog", "Bina menu / katalog"]);
    if (address) options.push(["address", "Guna alamat perniagaan"]);
    if (whatsapp) options.push(["whatsapp", "Nombor WhatsApp Malaysia"]);
    const mode = select(box, "appearance-" + key + "-mode", label, options), phone = el("input");
    phone.type = "tel";
    phone.placeholder = "Contoh: 012-2258950";
    phone.setAttribute("aria-label", "Nombor WhatsApp promosi");
    phone.hidden = true;
    box.append(phone);
    controls.push(phone);
    const open = el("a", "appearance-test-link", "Uji pautan \u2197");
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    box.append(open);
    const hint = help(box, address ? "Pilih pautan Maps sendiri atau jana arah daripada alamat yang anda simpan." : "Kosongkan pautan untuk menyembunyikan butang ini.");
    function sync() {
      input.hidden = ["none", "whatsapp", "catalog"].includes(mode.value);
      input.readOnly = ["address", "catalog"].includes(mode.value);
      phone.hidden = mode.value !== "whatsapp";
      phone.disabled = locked || phone.hidden;
      const url = safeAppearanceURL(input.value);
      open.hidden = !url || mode.value === "catalog";
      if (url) open.href = url;
      else open.removeAttribute("href");
      input.setCustomValidity(input.value && !url ? message("Gunakan pautan HTTPS yang sah.", "Enter a valid HTTPS link.") : "");
      mode.setCustomValidity(mode.value === "address" && !input.value ? message("Isi alamat perniagaan dahulu.", "Enter your business address first.") : "");
      phone.setCustomValidity(mode.value === "whatsapp" && !whatsappFromPhone(phone.value) ? message("Masukkan nombor telefon Malaysia yang sah.", "Enter a valid Malaysian phone number.") : "");
      hint.hidden = ["none", "catalog"].includes(mode.value);
    }
    mode.onchange = () => {
      if (mode.value === "none") {
        draft = input.value || draft;
        input.value = "";
      } else if (mode.value === "address") {
        input.value = mapsAddressURL($2("address").value);
      } else if (mode.value === "whatsapp") {
        input.value = whatsappFromPhone(phone.value) || "";
      } else input.value = draft;
      sync();
      changed();
    };
    phone.oninput = () => {
      input.value = whatsappFromPhone(phone.value) || "";
      sync();
      changed();
    };
    input.addEventListener("input", () => {
      draft = input.value;
      sync();
    });
    resetters.push(() => {
      draft = input.value;
      let builtIn = false;
      try {
        const u = new URL(input.value);
        builtIn = key === "menu" && u.origin === location.origin && u.pathname === "/menu/" && /^[A-Za-z0-9_-]{16}$/.test(u.searchParams.get("s") || "");
      } catch {
      }
      mode.value = builtIn ? "catalog" : input.value ? "link" : "none";
      phone.value = "";
      sync();
    });
    return { sync };
  }
  const links = [linkEditor("menu", "Jenis pautan menu / katalog"), linkEditor("directions", "Pilihan lokasi", { address: true }), linkEditor("promoURL", "Jenis pautan promosi", { whatsapp: true })];
  const promoTitleBox = wrap("promoTitle"), promoTextBox = wrap("promoText");
  const templates = select(promoTitleBox, "appearance-promo-template", "Idea promosi", [["", "Tulis promosi sendiri"], ["offer", "Tawaran istimewa"], ["menu", "Menu baharu"], ["booking", "Tempahan dibuka"]]);
  const examples = { offer: ["Tawaran istimewa", "Hubungi kami untuk maklumat tawaran terkini."], menu: ["Menu baharu", "Singgah dan cuba pilihan menu baharu kami."], booking: ["Tempahan dibuka", "Tempah awal untuk memastikan tempat anda."] };
  const englishExamples = { offer: ["Special offer", "Contact us for details of our latest offer."], menu: ["New menu", "Drop by and try our new menu choices."], booking: ["Bookings open", "Book early to secure your place."] };
  templates.onchange = () => {
    const example = (document.documentElement.lang === "en" ? englishExamples : examples)[templates.value];
    if (example) {
      [$2("promoTitle").value, $2("promoText").value] = example;
      changed();
    }
  };
  help(promoTitleBox, "Pilih idea sebagai permulaan, kemudian sunting mengikut tawaran anda. Kosongkan tajuk untuk menyembunyikan promosi.");
  const titleCount = help(promoTitleBox, ""), textCount = help(promoTextBox, "");
  titleCount.dataset.noI18n = "";
  textCount.dataset.noI18n = "";
  const promoPreview = el("div", "appearance-promo-preview");
  promoTextBox.append(promoPreview);
  const promoHeading = el("strong"), promoBody = el("p");
  promoHeading.dataset.noI18n = "";
  promoBody.dataset.noI18n = "";
  promoPreview.append(promoHeading, promoBody);
  const startBox = wrap("promoStart"), endBox = wrap("promoEnd");
  let dateDraft = { start: "", end: "" };
  const schedule = select(startBox, "appearance-schedule", "Jadual promosi", [["always", "Sepanjang masa"], ["range", "Tarikh mula & tamat"], ["start", "Bermula pada tarikh"], ["end", "Sehingga tarikh tamat"]]);
  const quick = el("div", "appearance-duration");
  startBox.append(quick);
  for (const days2 of [7, 14, 30]) button(days2 + " hari", () => {
    const range = promotionRange(days2);
    $2("promoStart").value = range.promoStart;
    $2("promoEnd").value = range.promoEnd;
    dateDraft = { start: range.promoStart, end: range.promoEnd };
    schedule.value = "range";
    syncDates();
    changed();
  }, quick);
  help(startBox, "Waktu Malaysia (UTC+8). Promosi dipaparkan mengikut jadual apabila halaman pelanggan dibuka.");
  const status = el("p", "appearance-promotion-state");
  status.setAttribute("role", "status");
  endBox.append(status);
  function syncDates() {
    const start = ["range", "start"].includes(schedule.value), end = ["range", "end"].includes(schedule.value);
    $2("promoStart").hidden = !start;
    $2("promoEnd").hidden = !end;
    for (const [key, show] of [["promoStart", start], ["promoEnd", end]]) {
      const label = document.querySelector('label[for="field-' + key + '"]');
      if (label) label.hidden = !show;
    }
    $2("promoStart").required = start;
    $2("promoEnd").required = end;
    $2("promoEnd").setCustomValidity(start && end && $2("promoStart").value && $2("promoEnd").value && $2("promoEnd").value <= $2("promoStart").value ? message("Tarikh tamat mesti selepas tarikh mula.", "The end date must be after the start date.") : "");
  }
  schedule.onchange = () => {
    if ($2("promoStart").value) dateDraft.start = $2("promoStart").value;
    if ($2("promoEnd").value) dateDraft.end = $2("promoEnd").value;
    $2("promoStart").value = ["range", "start"].includes(schedule.value) ? dateDraft.start : "";
    $2("promoEnd").value = ["range", "end"].includes(schedule.value) ? dateDraft.end : "";
    syncDates();
    changed();
  };
  for (const key of ["promoStart", "promoEnd"]) $2(key).addEventListener("input", syncDates);
  resetters.push(() => {
    templates.value = "";
    dateDraft = { start: $2("promoStart").value, end: $2("promoEnd").value };
    schedule.value = dateDraft.start ? dateDraft.end ? "range" : "start" : dateDraft.end ? "end" : "always";
    syncDates();
  });
  const coverEmpty = el("div", "appearance-cover-empty", "Belum ada cover. Latar tema akan digunakan.");
  coverEmpty.id = "appearance-cover-empty";
  const coverTip = el("p", "help", "Cadangan cover: gambar melintang 16:9. Pastikan subjek utama di tengah supaya sesuai pada telefon.");
  const coverMeta = el("p", "help");
  coverMeta.id = "appearance-cover-meta";
  coverMeta.dataset.noI18n = "";
  function refresh() {
    hex.value = $2("accent").value;
    for (const b of themeCards.children) b.setAttribute("aria-pressed", String(b.dataset.choice === $2("theme").value));
    for (const b of swatches.children) b.setAttribute("aria-pressed", String(b.dataset.color === $2("accent").value));
    const theme = $2("theme").value;
    themePreview.dataset.theme = theme;
    themePreview.style.setProperty("--preview-accent", $2("accent").value);
    previewName.textContent = $2("name").value || "SmartTap";
    previewText.textContent = $2("tagline").value;
    previewButton.style.color = contrast($2("accent").value);
    titleCount.textContent = $2("promoTitle").value.length + " / 70";
    textCount.textContent = $2("promoText").value.length + " / 180";
    promoHeading.textContent = $2("promoTitle").value;
    promoBody.textContent = $2("promoText").value;
    promoPreview.hidden = !$2("promoTitle").value;
    const state = promotionState({ promoTitle: $2("promoTitle").value, promoStart: $2("promoStart").value, promoEnd: $2("promoEnd").value });
    status.dataset.state = state;
    status.textContent = { empty: "Tiada promosi \u2014 isi tajuk pada tab Promosi.", active: "Promosi aktif", scheduled: "Promosi dijadualkan \u2014 belum bermula", expired: "Promosi tamat \u2014 tidak dipaparkan", invalid: "Semak tarikh mula dan tamat." }[state];
    coverEmpty.hidden = !!$2("cover").value;
  }
  for (const key of ["name", "tagline", "theme", "accent", "promoTitle", "promoText", "promoStart", "promoEnd"]) $2(key).addEventListener("input", refresh);
  $2("theme").addEventListener("change", refresh);
  window.addEventListener("smarttap:language", () => {
    for (const link of links) link.sync();
    syncDates();
  });
  function lock(value) {
    locked = value;
    for (const c of controls) c.disabled = value;
    for (const link of links) link.sync();
  }
  return { nodes, coverNodes: [coverEmpty, coverTip, coverMeta], refresh, lock, set() {
    for (const reset of resetters) reset();
    coverMeta.textContent = "";
    refresh();
  }, coverSelected(file) {
    coverMeta.textContent = file ? file.name + " \xB7 " + (file.size / 1024 / 1024).toFixed(2) + " MB" : "";
    refresh();
  } };
}
function contrast(hex) {
  const rgb = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.179 ? "#14281f" : "#ffffff";
}

// src/business-details-values.mjs
var malaysiaStates = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
var days = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"];
var hourModes = { daily: "Setiap hari", weekdays: "Isnin\u2013Jumaat", weekends: "Sabtu\u2013Ahad", weekly: "Mengikut hari", custom: "Teks sedia ada / tersuai" };
var timeSlots = Array.from({ length: 48 }, (_, i) => String(Math.floor(i / 2)).padStart(2, "0") + ":" + (i % 2 ? "30" : "00"));
var validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
function defaultSchedule() {
  return days.map(() => ({ state: "open", open: "09:00", close: "18:00" }));
}
function period(value) {
  if (value.state === "closed") return "Tutup";
  if (value.state === "all") return "24 jam";
  if (value.state !== "open" || !validTime(value.open) || !validTime(value.close) || value.open === value.close) throw Error("Semak waktu buka dan tutup. Pilih 24 jam jika dibuka sepanjang hari.");
  return value.open + "\u2013" + value.close;
}
function formatHours(mode, schedule) {
  let result;
  if (mode === "weekly") result = days.map((day, i) => day + ": " + period(schedule[i])).join("; ");
  else {
    if (!["daily", "weekdays", "weekends"].includes(mode)) throw Error("Pilih jadual operasi.");
    result = hourModes[mode] + ": " + period(schedule[0]);
    if (mode === "weekdays") result += "; Sabtu\u2013Ahad: Tutup";
    if (mode === "weekends") result += "; Isnin\u2013Jumaat: Tutup";
  }
  if (result.length > 240) throw Error("Waktu operasi melebihi 240 aksara.");
  return result;
}
function readPeriod(value) {
  if (value === "Tutup") return { state: "closed", open: "09:00", close: "18:00" };
  if (value === "24 jam") return { state: "all", open: "09:00", close: "18:00" };
  const match = /^(\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(value);
  return match && validTime(match[1]) && validTime(match[2]) && match[1] !== match[2] ? { state: "open", open: match[1], close: match[2] } : null;
}
function readHours(raw) {
  for (const mode of ["daily", "weekdays", "weekends"]) {
    const prefix = hourModes[mode] + ": ";
    if (!raw.startsWith(prefix)) continue;
    const suffix = mode === "weekdays" ? "; Sabtu\u2013Ahad: Tutup" : mode === "weekends" ? "; Isnin\u2013Jumaat: Tutup" : "";
    if (suffix && !raw.endsWith(suffix)) continue;
    const value = readPeriod(raw.slice(prefix.length, suffix ? -suffix.length : void 0));
    if (value) return { mode, schedule: days.map(() => ({ ...value })) };
  }
  const parts = raw.split("; ");
  if (parts.length !== 7) return null;
  const schedule = parts.map((part, i) => part.startsWith(days[i] + ": ") ? readPeriod(part.slice(days[i].length + 2)) : null);
  return schedule.every(Boolean) ? { mode: "weekly", schedule } : null;
}
function formatAddress({ line1, line2 = "", postcode, city, state }) {
  const clean = (value) => typeof value === "string" ? value.normalize("NFC").trim() : "";
  line1 = clean(line1);
  line2 = clean(line2);
  city = clean(city);
  if (!line1 || !/^\d{5}$/.test(postcode) || !city || !malaysiaStates.includes(state)) throw Error("Lengkapkan alamat, poskod 5 digit, bandar dan negeri.");
  const result = [line1, line2, postcode + " " + city, state].filter(Boolean).join("\n");
  if (result.length > 240) throw Error("Alamat terlalu panjang. Gunakan maksimum 240 aksara.");
  return result;
}
function readAddress(raw) {
  const lines = raw.split("\n");
  if (lines.length < 3 || lines.length > 4 || !malaysiaStates.includes(lines.at(-1))) return null;
  const match = /^(\d{5}) (.+)$/.exec(lines.at(-2));
  if (!match || !lines[0]) return null;
  return { line1: lines[0], line2: lines.length === 4 ? lines[1] : "", postcode: match[1], city: match[2], state: lines.at(-1) };
}

// src/business-details-ui.mjs
function createBusinessDetails({ addressInput, hoursInput, onChange }) {
  const el = (tag, text2) => {
    const node = document.createElement(tag);
    if (text2) node.textContent = text2;
    return node;
  };
  const select = (id, options) => {
    const node = el("select");
    node.id = id;
    for (const [value, text2] of Object.entries(options)) {
      const option = el("option", text2);
      option.value = value;
      node.append(option);
    }
    return node;
  };
  const field = (label, input) => {
    const box = el("div");
    box.className = "business-detail-field";
    const caption = el("label", label);
    caption.htmlFor = input.id;
    box.append(caption, input);
    return box;
  };
  const addressWrap = el("div");
  addressWrap.className = "business-detail-editor";
  addressInput.before(addressWrap);
  const addressMode = select("business-address-mode", { custom: "Teks sedia ada / tersuai", structured: "Alamat Malaysia" }), addressFields2 = el("div");
  addressFields2.className = "business-address-fields";
  const addressParts = {};
  for (const [key, label, max] of [["line1", "Alamat baris 1", 110], ["line2", "Alamat baris 2 (pilihan)", 80], ["postcode", "Poskod", 5], ["city", "Bandar", 60], ["state", "Negeri", 40]]) {
    const input = key === "state" ? select("business-address-state", Object.fromEntries([["", "Pilih negeri"], ...malaysiaStates.map((state2) => [state2, state2])])) : el("input");
    input.id = "business-address-" + key;
    if (key !== "state") {
      input.type = "text";
      input.maxLength = max;
    }
    if (key === "postcode") {
      input.pattern = "[0-9]{5}";
      input.inputMode = "numeric";
    }
    input.required = key !== "line2";
    input.autocomplete = "off";
    addressParts[key] = input;
    const box = field(label, input);
    box.dataset.part = key;
    addressFields2.append(box);
  }
  const addressHelp = el("p", "Pilih negeri daripada senarai. Poskod dan bandar diisi mengikut alamat perniagaan. Maksimum 240 aksara untuk alamat penuh.");
  addressHelp.className = "help";
  addressWrap.append(field("Format alamat", addressMode), addressInput, addressFields2, addressHelp);
  const hoursWrap = el("div");
  hoursWrap.className = "business-detail-editor";
  hoursInput.before(hoursWrap);
  const mode = select("business-hours-mode", hourModes), day = select("business-hours-day", Object.fromEntries(days.map((name, i) => [i, name]))), state = select("business-hours-state", { open: "Dibuka", closed: "Tutup", all: "24 jam" });
  const open = select("business-hours-open", Object.fromEntries(timeSlots.map((time) => [time, time]))), close = select("business-hours-close", Object.fromEntries(timeSlots.map((time) => [time, time])));
  const hoursFields = el("div"), timeRow = el("div");
  hoursFields.className = "business-hours-fields";
  timeRow.className = "business-time-row";
  timeRow.append(field("Waktu buka", open), field("Waktu tutup", close));
  const dayBox = field("Pilih hari", day);
  hoursFields.append(dayBox, field("Status operasi", state), timeRow);
  const hint = el("p", "Waktu Malaysia \xB7 format 24 jam. Pilih jadual dahulu untuk menggunakan dropdown waktu.");
  hint.className = "help";
  const preview = el("details");
  preview.className = "business-hours-preview";
  const previewText = el("p");
  previewText.dataset.noI18n = "";
  preview.append(el("summary", "Lihat jadual penuh"), previewText);
  hoursWrap.append(field("Jadual operasi", mode), hoursInput, hoursFields, hint, preview);
  let locked = false, schedule = defaultSchedule(), dayIndex = 0, lastMode = "custom";
  const timeValue = (input, value) => {
    if (![...input.options].some((option) => option.value === value)) {
      const option = el("option", value);
      option.value = value;
      input.append(option);
    }
    input.value = value;
  };
  function permissions() {
    addressMode.disabled = mode.disabled = locked;
    addressInput.disabled = hoursInput.disabled = locked;
    const structured = addressMode.value === "structured";
    addressInput.hidden = structured;
    addressFields2.hidden = !structured;
    addressHelp.hidden = !structured;
    for (const input of Object.values(addressParts)) input.disabled = locked || !structured;
    const custom = mode.value === "custom";
    hoursInput.hidden = !custom;
    hoursFields.hidden = custom;
    preview.hidden = custom;
    dayBox.hidden = mode.value !== "weekly";
    day.disabled = locked || mode.value !== "weekly";
    state.disabled = locked || custom;
    const timed = !custom && state.value === "open";
    timeRow.hidden = !timed;
    open.disabled = close.disabled = locked || !timed;
  }
  function showDay() {
    const value = schedule[mode.value === "weekly" ? dayIndex : 0];
    state.value = value.state;
    timeValue(open, value.open);
    timeValue(close, value.close);
    hint.textContent = mode.value === "custom" ? "Waktu Malaysia \xB7 format 24 jam. Pilih jadual dahulu untuk menggunakan dropdown waktu." : value.state === "open" && value.close < value.open ? "Waktu tutup adalah pada hari berikutnya." : "Waktu Malaysia \xB7 format 24 jam.";
    permissions();
  }
  function syncAddress() {
    addressParts.line1.setCustomValidity("");
    if (addressMode.value === "structured") try {
      addressInput.value = formatAddress(Object.fromEntries(Object.entries(addressParts).map(([key, input]) => [key, input.value])));
    } catch (error) {
      if (Object.values(addressParts).every((input) => input.checkValidity())) addressParts.line1.setCustomValidity(error.message);
    }
    permissions();
    onChange();
  }
  function syncHours() {
    close.setCustomValidity("");
    schedule[mode.value === "weekly" ? dayIndex : 0] = { state: state.value, open: open.value, close: close.value };
    if (mode.value !== "custom") try {
      hoursInput.value = formatHours(mode.value, schedule);
      previewText.textContent = hoursInput.value;
      hint.textContent = state.value === "open" && close.value < open.value ? "Waktu tutup adalah pada hari berikutnya." : "Waktu Malaysia \xB7 format 24 jam.";
    } catch (error) {
      close.setCustomValidity(error.message);
    }
    permissions();
    onChange();
  }
  addressMode.onchange = () => {
    if (addressMode.value === "structured" && !addressParts.line1.value) addressParts.line1.value = addressInput.value;
    syncAddress();
  };
  for (const input of Object.values(addressParts)) input.addEventListener("input", syncAddress);
  mode.onchange = () => {
    if (mode.value === "weekly" && lastMode !== "weekly") {
      const value = { ...schedule[0] };
      schedule = days.map((_, i) => lastMode === "weekdays" && i > 4 || lastMode === "weekends" && i < 5 ? { state: "closed", open: "09:00", close: "18:00" } : { ...value });
    }
    lastMode = mode.value;
    dayIndex = 0;
    day.value = "0";
    close.setCustomValidity("");
    showDay();
    syncHours();
  };
  day.onchange = () => {
    if (!close.checkValidity()) {
      day.value = String(dayIndex);
      close.reportValidity();
      return;
    }
    dayIndex = Number(day.value);
    showDay();
  };
  for (const input of [state, open, close]) input.onchange = syncHours;
  return { nodes: { address: [addressWrap], hours: [hoursWrap] }, lock(value) {
    locked = value;
    permissions();
  }, set(profile) {
    const address = readAddress(profile.address || "");
    addressMode.value = address ? "structured" : "custom";
    for (const [key, input] of Object.entries(addressParts)) {
      input.value = address?.[key] || "";
      input.setCustomValidity("");
    }
    const parsed = readHours(profile.hours || "");
    mode.value = parsed?.mode || "custom";
    lastMode = mode.value;
    schedule = parsed?.schedule || defaultSchedule();
    dayIndex = 0;
    day.value = "0";
    close.setCustomValidity("");
    previewText.textContent = profile.hours || "";
    hint.textContent = "Waktu Malaysia \xB7 format 24 jam. Pilih jadual dahulu untuk menggunakan dropdown waktu.";
    showDay();
  } };
}

// src/orders-ui.mjs
var states = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
var fulfillmentLabels = { unpaid: "Menunggu bayaran", awaiting_address: "Bayaran diterima \xB7 perlukan alamat", received: "Alamat diterima", preparing: "Sedang disediakan", shipped: "Dihantar", completed: "Selesai" };
var paymentLabels = { creating: "Bil sedang disediakan", pending: "Menunggu bayaran", failed: "Bayaran belum berjaya", creation_failed: "Bil belum dapat disediakan", cancelled: "Dibatalkan", paid: "Bayaran disahkan", review: "Bayaran memerlukan semakan admin", resolved: "Semakan selesai \xB7 pemulangan wang direkodkan" };
var money = (value) => new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(value / 100);
var date = (value) => value ? new Date(value).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" }) : "\u2014";
var addressFields = { name: ["Nama penerima", 100], phone: ["Telefon penerima", 30], notes: ["Nota penghantaran (pilihan)", 300], line1: ["Alamat baris 1", 160], line2: ["Alamat baris 2 (pilihan)", 160], postcode: ["Poskod", 5], city: ["Bandar", 80], state: ["Negeri", 40] };
function createOrdersUI({ customer: customer2, api: api2, onPageUpdated = () => {
}, onOrderChanged = () => {
}, onBusy = () => {
}, onContact = () => {
}, canMutate = () => true }) {
  const panel = document.createElement("section");
  panel.id = "orders-panel";
  panel.className = "orders-panel";
  panel.innerHTML = '<h2>Pesanan saya</h2><p class="help">Semak pembelian, alamat dan penghantaran untuk perniagaan ini. Status penghantaran dikemas kini oleh super admin.</p><label for="orders-picker">Pilih pesanan</label><div class="orders-selector"><select id="orders-picker"></select><button type="button" id="orders-refresh" class="secondary" aria-label="Muat semula pesanan"><span aria-hidden="true">\u21BB</span><span class="orders-refresh-label">Muat semula pesanan</span></button><button type="button" id="orders-more" class="secondary" hidden>Pesanan terdahulu</button></div><p id="orders-status" role="status" aria-live="polite"></p><div id="order-body" hidden><nav class="customer-subnav orders-tabs" aria-label="Bahagian pesanan"></nav><section id="order-details"></section><form id="order-address-form" novalidate><div id="order-recipient"></div><div id="order-address"></div><p class="help">Penghantaran Malaysia sahaja. Alamat disimpan untuk pesanan ini dan hanya boleh dilihat oleh pemilik yang berhak serta super admin.</p><button type="submit" id="order-address-save">Simpan maklumat penghantaran</button><p id="order-address-lock" class="help" hidden>Pesanan sudah dihantar. Hubungi super admin untuk pembetulan alamat.</p></form><section id="order-tracking"><p id="order-tracking-state" class="notice"></p><div id="order-tracking-info"></div><ol id="order-timeline"></ol><form id="order-fulfillment-form"><label for="order-fulfillment-state">Status penyediaan / penghantaran</label><select id="order-fulfillment-state"></select><label for="order-courier">Nama kurier</label><input id="order-courier" maxlength="80" placeholder="Contoh: Pos Laju / J&T Express"><label for="order-tracking-number">Nombor tracking</label><input id="order-tracking-number" maxlength="100"><label for="order-tracking-url">Pautan tracking kurier (pilihan)</label><input id="order-tracking-url" type="url" maxlength="500" placeholder="https://"><button type="submit" id="order-fulfillment-save">Simpan status penghantaran</button></form></section><button id="order-contact" type="button" class="secondary" hidden>Perlukan bantuan? Buka Mesej</button><p class="help" id="order-contact-help" hidden>Semua pertanyaan kepada super admin diuruskan dalam Mesej.</p></div>';
  if (!customer2) panel.querySelector("h2").textContent = "Pesanan pelanggan";
  const resolutionForm = document.createElement("form");
  resolutionForm.id = "order-resolution";
  resolutionForm.hidden = true;
  resolutionForm.innerHTML = '<h3>Bayaran perlu tindakan</h3><p class="notice">ToyyibPay akan disemak semula. Pengaktifan kepada pemilik semasa memerlukan pengesahan Gmail dan nota admin.</p><label for="resolution-action">Tindakan penyelesaian</label><select id="resolution-action"><option value="apply">Aktifkan untuk pemilik semasa yang disahkan</option><option value="record-refund">Rekod pemulangan wang yang telah dibuat di luar SmartTap</option></select><div id="resolution-apply"><label for="resolution-email">Taip Gmail pemilik semasa untuk sahkan</label><input id="resolution-email" type="email" maxlength="100" autocomplete="off"></div><div id="resolution-refund" hidden><p class="help">Tindakan ini hanya menyimpan rekod. Ia tidak menghantar wang atau membuat refund di ToyyibPay.</p><label for="resolution-reference">Rujukan pemulangan wang</label><input id="resolution-reference" maxlength="100" autocomplete="off"><label class="check-label"><input id="resolution-confirm" type="checkbox"> Saya telah menyemak dan mengesahkan wang telah dipulangkan di luar SmartTap.</label></div><label for="resolution-note">Nota keputusan admin</label><textarea id="resolution-note" required maxlength="200" rows="3"></textarea><button type="submit">Sahkan penyelesaian bayaran</button><p id="resolution-status" role="status" aria-live="polite"></p>';
  panel.querySelector("#order-details").after(resolutionForm);
  const $2 = (id) => panel.querySelector("#" + id), el = (tag, text2) => {
    const n = document.createElement(tag);
    if (text2) n.textContent = text2;
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
  let page = null, order = null, items = [], cursor2 = null, tab = "details", sequence = 0, signature = "", working = false, focusOrder = null;
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
    const contactVisible = customer2 && order?.paymentStatus === "paid" && ["details", "tracking"].includes(tab);
    $2("order-contact").hidden = !contactVisible;
    $2("order-contact-help").hidden = !contactVisible;
    $2("order-details").hidden = tab !== "details";
    $2("order-address-form").hidden = !["recipient", "address"].includes(tab);
    $2("order-recipient").hidden = tab !== "recipient";
    $2("order-address").hidden = tab !== "address";
    $2("order-tracking").hidden = tab !== "tracking";
    resolutionForm.hidden = customer2 || !(order?.paymentStatus === "review" || page?.paymentResolution?.orderId === order?.id) || tab !== "details";
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
    for (const node of resolutionForm.querySelectorAll("input,select,textarea,button")) node.disabled = working;
    if (order?.resolution?.action) $2("resolution-action").disabled = true;
    const acknowledge = panel.querySelector("[data-order-ack]");
    if (acknowledge) acknowledge.disabled = working;
  }
  function render2() {
    if (!order) {
      $2("order-body").hidden = true;
      resolutionForm.hidden = true;
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
    if (!customer2 && order.paymentStatus === "paid" && !order.alertAcknowledgedAt) {
      const button = el("button", "Tandakan pesanan telah dilihat");
      button.type = "button";
      button.dataset.orderAck = "";
      button.disabled = working;
      button.onclick = () => save("acknowledge", {});
      details.append(button);
    }
    if (!customer2 && order.resolution) {
      const audit = el("p", "Keputusan: " + (order.resolution.action === "apply" ? "Pengaktifan disahkan" : "Pemulangan wang direkodkan") + " \xB7 " + order.resolution.note);
      audit.dataset.noI18n = "";
      details.append(audit);
    }
    if (order.paymentStatus === "review" || page?.paymentResolution?.orderId === order.id) {
      const intent = order.resolution || page.paymentResolution;
      $2("resolution-action").value = intent?.action || "apply";
      $2("resolution-note").value = intent?.note || "";
      $2("resolution-email").value = "";
      $2("resolution-reference").value = intent?.reference || "";
      $2("resolution-confirm").checked = false;
      resolutionVisibility();
    }
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
    $2("order-contact").onclick = () => {
      if (customer2 && order?.paymentStatus === "paid") onContact(order.id);
    };
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
      const id = focusOrder || (items.some((item) => item.id === previous) ? previous : items[0].id);
      focusOrder = null;
      if (!items.some((item) => item.id === id)) {
        const option = el("option", id);
        option.value = id;
        $2("orders-picker").append(option);
      }
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
    if (!order || working || !canMutate()) return;
    const current = sequence;
    working = true;
    onBusy(true);
    controls();
    $2("orders-status").textContent = "Menyimpan pesanan\u2026";
    try {
      const result = await api2(path() + "/" + order.id + "/" + action, { method: "PUT", body: { revision: order.revision, ...data } });
      if (current !== sequence) return;
      order = result;
      render2();
      onOrderChanged();
      $2("orders-status").textContent = "Maklumat pesanan berjaya disimpan.";
    } catch (e) {
      if (current === sequence) $2("orders-status").textContent = e.message;
    } finally {
      onBusy(false);
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  }
  function resolutionVisibility() {
    const apply = $2("resolution-action").value === "apply";
    $2("resolution-apply").hidden = !apply;
    $2("resolution-refund").hidden = apply;
    $2("resolution-email").required = apply;
    $2("resolution-reference").required = !apply;
    $2("resolution-confirm").required = !apply;
  }
  $2("resolution-action").onchange = resolutionVisibility;
  resolutionForm.onsubmit = async (event) => {
    event.preventDefault();
    if (customer2 || !order || working || !canMutate() || !resolutionForm.reportValidity()) return;
    const current = sequence, id = order.id;
    working = true;
    onBusy(true);
    controls();
    $2("resolution-status").textContent = "Mengesahkan transaksi dan menyimpan keputusan\u2026";
    try {
      const action = $2("resolution-action").value, body = { action, revision: order.revision, pageRevision: page.revision, note: $2("resolution-note").value.trim(), ...action === "apply" ? { confirmEmail: $2("resolution-email").value.trim() } : { reference: $2("resolution-reference").value.trim(), confirmRefund: $2("resolution-confirm").checked } };
      const result = await api2("/checkout/" + id + "/resolve", { method: "POST", body });
      if (current !== sequence) return;
      page = result.page;
      order = await api2(path() + "/" + id);
      if (current !== sequence) return;
      render2();
      await onPageUpdated(result.page);
      onOrderChanged();
      $2("orders-status").textContent = "Semakan bayaran diselesaikan dan direkodkan.";
    } catch (e) {
      if (current === sequence) $2("resolution-status").textContent = e.message;
    } finally {
      onBusy(false);
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  };
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
  return { panel, show(item, orderId) {
    const next = item.id + "|" + (item.checkout?.id || "") + "|" + (item.checkout?.status || "");
    const changed = page?.id !== item.id;
    page = item;
    focusOrder = orderId || null;
    if (next === signature && !orderId) return;
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
    focusOrder = null;
    resolutionForm.hidden = true;
    render2();
    $2("orders-picker").replaceChildren();
    $2("orders-status").textContent = "";
  } };
}

// src/payment-alerts.mjs
function createPaymentAlerts({ api: api2, open, canOpen }) {
  const labels = { manual_review: "Bayaran manual menunggu semakan", payment_review: "Bayaran perlu tindakan", new_order: "Pesanan baharu dibayar", awaiting_address: "Menunggu alamat penghantaran", fulfillment: "Pesanan untuk disediakan" };
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
        status.textContent = data.count ? "Pilih pesanan untuk tindakan seterusnya." : "Tiada pesanan atau bayaran memerlukan tindakan.";
        list.replaceChildren();
        for (const item of data.items) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "payment-alert-item secondary";
          const name = document.createElement("strong");
          name.textContent = item.name;
          name.dataset.noI18n = "";
          const category = document.createElement("span");
          category.textContent = labels[item.category] || labels.manual_review;
          const detail = document.createElement("span");
          detail.dataset.noI18n = "";
          detail.textContent = (item.mode && item.mode !== "live" ? "DEMO / SANDBOX \xB7 " : "") + new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(item.amountCents / 100) + " \xB7 " + new Date(item.submittedAt).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" });
          button.append(name, category, detail);
          button.addEventListener("click", async () => {
            if (!canOpen()) return;
            button.disabled = true;
            try {
              await open(item.id, item.orderId);
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
  menuLabel: { label: "Nama butang menu / katalog", max: 40 },
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

// import-service/page-state.mjs
var hasEntitlement = (record) => !!(record.subscription?.lastPaymentId || record.subscription?.lastGrantId);
var hasAnnualEntitlement = (record) => record.subscription?.plan === "annual" && hasEntitlement(record);
function annualEnd(value) {
  const start = new Date(value), year = start.getUTCFullYear() + 1, month = start.getUTCMonth();
  const day = Math.min(start.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return new Date(Date.UTC(year, month, day, start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds())).toISOString();
}

// src/admin-subscription-ui.mjs
function createAdminSubscriptionUI({ customer: customer2, onSubmit }) {
  const panel = document.createElement("section");
  panel.id = "subscription-management";
  panel.className = "subscription-admin";
  panel.dataset.noI18n = "";
  panel.hidden = true;
  let item = null, working = false, language = "ms";
  try {
    language = localStorage.getItem("smarttap.language") || "ms";
  } catch {
  }
  const L = (ms, en) => language === "en" ? en : ms, copies = [];
  const node = (tag, ms, en) => {
    const el = document.createElement(tag);
    if (ms) {
      copies.push({ el, ms, en });
      el.textContent = L(ms, en);
    }
    return el;
  };
  const source = node("p", "Langganan ditetapkan oleh super admin.", "Subscription set by the super admin.");
  source.className = "notice";
  panel.append(source);
  const details = node("details"), summary = node("summary", "Tetapkan langganan tanpa ToyyibPay", "Set subscription without ToyyibPay");
  details.append(summary);
  panel.append(details);
  const form = node("form");
  form.id = "admin-subscription-form";
  details.append(form);
  form.append(node("p", "Aktifkan halaman tahunan secara terus. Ini tidak mencipta bil, resit bayaran atau pesanan NFC.", "Activate an annual page directly. This does not create a bill, payment receipt or NFC order."));
  function field(id, ms, en, input) {
    input.id = id;
    const label = node("label", ms, en);
    label.htmlFor = id;
    form.append(label, input);
    return input;
  }
  const mode = field("subscription-action", "Tindakan langganan", "Subscription action", node("select"));
  for (const [value, ms, en] of [["extend", "Aktifkan / lanjutkan 12 bulan", "Activate / extend 12 months"], ["set-date", "Tetapkan tarikh tamat", "Set expiry date"]]) {
    const o = node("option", ms, en);
    o.value = value;
    mode.append(o);
  }
  const date4 = field("subscription-expiry", "Tarikh tamat (waktu Malaysia)", "Expiry date (Malaysia time)", node("input"));
  date4.type = "date";
  const dateLabel = form.querySelector('label[for="subscription-expiry"]');
  const preview = node("p");
  preview.id = "subscription-preview";
  preview.setAttribute("role", "status");
  form.append(preview);
  const note = field("subscription-note", "Sebab pelarasan (catatan dalaman)", "Reason for adjustment (internal note)", node("input"));
  note.required = true;
  note.maxLength = 200;
  note.autocomplete = "off";
  const blocked = node("p");
  blocked.className = "notice";
  blocked.id = "subscription-blocked";
  form.append(blocked);
  const save = node("button", "Simpan langganan", "Save subscription");
  save.type = "submit";
  save.id = "subscription-save";
  form.append(save);
  const history = node("p");
  history.className = "help";
  history.id = "subscription-audit";
  details.append(history);
  function unavailable() {
    return item?.renewal?.status === "pending" || item?.checkout && !["paid", "cancelled", "creation_failed"].includes(item.checkout.status);
  }
  function refresh() {
    const custom = mode.value === "set-date";
    date4.hidden = dateLabel.hidden = !custom;
    date4.required = custom;
    for (const input of form.querySelectorAll("input,select,button")) input.disabled = working || !!unavailable();
    date4.disabled = working || !!unavailable() || !custom;
    const today = new Date(Date.now() + 8 * 36e5).toISOString().slice(0, 10);
    date4.min = today;
    let end = "";
    if (custom && date4.value) end = date4.value + "T23:59:59.999+08:00";
    else if (!custom) {
      const old = item?.subscription?.plan === "annual" ? Date.parse(item.subscription.expiresAt || "") : 0;
      end = annualEnd(Math.max(Number.isFinite(old) ? old : 0, Date.now()));
    }
    preview.textContent = end ? L("Tarikh tamat baharu: ", "New expiry: ") + new Date(end).toLocaleDateString(language === "en" ? "en-MY" : "ms-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "long", year: "numeric" }) + (item?.manualState === "disabled" ? L(" \xB7 Halaman kekal dinyahaktifkan.", " \xB7 Page remains disabled.") : "") : "";
    blocked.hidden = !unavailable();
    blocked.textContent = L("Selesaikan atau batalkan bil/semakan bayaran yang masih terbuka dahulu.", "Complete or cancel the open bill/payment review first.");
  }
  mode.onchange = refresh;
  date4.oninput = refresh;
  form.onsubmit = (event) => {
    event.preventDefault();
    if (working || unavailable() || !item) return;
    onSubmit({ action: mode.value, note: note.value.trim(), ...mode.value === "set-date" ? { expiresDate: date4.value } : {} });
  };
  function renderHistory() {
    const audit = item?.subscriptionAdjustment;
    history.textContent = audit ? L("Pelarasan terakhir: ", "Last adjustment: ") + new Date(audit.changedAt).toLocaleString(language === "en" ? "en-MY" : "ms-MY", { timeZone: "Asia/Kuala_Lumpur" }) + " \xB7 " + audit.changedBy + " \xB7 " + audit.note : "";
  }
  window.addEventListener("smarttap:language", (event) => {
    language = event.detail.language === "en" ? "en" : "ms";
    for (const { el, ms, en } of copies) el.textContent = L(ms, en);
    renderHistory();
    refresh();
  });
  return { panel, set(value) {
    const changed = item?.id !== value.id || item?.revision !== value.revision;
    item = value;
    panel.hidden = customer2 && item.subscription?.source !== "admin";
    source.hidden = item.subscription?.source !== "admin";
    details.hidden = customer2 || item.manualState === "deleted";
    if (changed) {
      details.open = false;
      mode.value = "extend";
      date4.value = "";
      note.value = "";
    }
    renderHistory();
    refresh();
  }, busy(value) {
    working = value;
    refresh();
  }, clear() {
    item = null;
    details.open = false;
    note.value = "";
    date4.value = "";
    history.textContent = "";
    panel.hidden = true;
  } };
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
function orderSupportLink(item, { customer: customer2 = false, language = "ms", orderId = null } = {}) {
  const approved = item.renewal?.status === "approved" ? item.renewal : null;
  const id = orderId || approved?.id || item.subscription?.lastPaymentId;
  if (!customer2 || item.manualState === "deleted") return null;
  const en = language === "en";
  const lines = [en ? "Hello SmartTap super admin, I need assistance." : "Salam super admin SmartTap, saya perlukan bantuan.", (en ? "Business: " : "Perniagaan: ") + item.profile.name];
  if (typeof id === "string" && id) lines.push((en ? "Order ID: " : "ID pesanan: ") + id);
  if (approved && id === approved.id) {
    if (approved.items?.length) lines.push((en ? "Order: " : "Pesanan: ") + approved.items.map((line) => line.name + " \xD7 " + line.quantity).join(", "));
    if (approved.reference) lines.push((en ? "Payment reference: " : "Rujukan bayaran: ") + approved.reference);
  }
  const note = item.adminMessage?.status !== "resolved" ? item.adminMessage?.text : null;
  const message = note || (!item.adminMessage ? item.renewal?.note : "");
  if (message) lines.push((en ? "Admin message: " : "Mesej admin: ") + message);
  lines.push((en ? "Page link: " : "Pautan halaman: ") + item.url);
  lines.push("", en ? "My enquiry: " : "Pertanyaan saya: ");
  const url = new URL("https://wa.me/60103250032");
  url.searchParams.set("text", lines.join("\n"));
  return { url: url.href };
}

// src/management-ui.mjs
var money2 = (cents) => new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(cents / 100);
var date2 = (value) => value ? new Date(value).toLocaleDateString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "long", year: "numeric" }) : "Belum bermula";
var stateLabels = { active: "Aktif", disabled: "Dinyahaktifkan", deleted: "Dipadam", pending: "Menunggu pengaktifan", expired: "Langganan tamat", nfc_only: "NFC sahaja \xB7 sekali bayar" };
function createManagementUI({ customer: customer2, api: api2, onUpdate, onBusy, onPurge = () => {
} }) {
  const panel = document.createElement("section");
  panel.className = "management-panel";
  panel.innerHTML = `<section id="admin-message-box" class="admin-message-box" hidden aria-labelledby="admin-message-title"><h3 id="admin-message-title">Mesej daripada super admin</h3><p id="admin-message-text" data-no-i18n></p><p id="admin-message-time" class="help" data-no-i18n></p><p id="admin-message-state" role="status" aria-live="polite"></p><div id="admin-message-reply" hidden><strong>Balasan pelanggan</strong><p id="admin-message-reply-text" data-no-i18n></p></div><form id="message-reply-form" hidden><label for="message-reply-text">Nombor transaksi / balasan anda</label><textarea id="message-reply-text" required maxlength="500" rows="3"></textarea><button type="submit">Hantar balasan kepada super admin</button></form><button id="message-resolve" type="button" class="secondary" hidden>Tandakan selesai</button></section>
  <form id="admin-message-form" class="admin-message-compose" ${customer2 ? "hidden" : ""}><h3>Hantar mesej kepada pelanggan</h3><label for="admin-message-input">Mesej / tindakan yang diperlukan</label><textarea id="admin-message-input" required maxlength="1000" rows="3" placeholder="Contoh: Sila berikan nombor transaksi bank untuk semakan bayaran."></textarea><p class="help">Mesej muncul pada halaman edit pelanggan. Mesej baharu menggantikan mesej semasa; rekod sebelumnya disimpan.</p><button type="submit">Hantar mesej</button></form><h3>Status halaman & pakej</h3><p id="page-state" class="notice"></p><p id="subscription-summary"></p><p id="google-listing-status" class="notice" hidden>Google Review belum tersedia. Super admin akan menyambungkan lokasi apabila tersedia di Google Maps.</p><p id="direct-review-wrap" hidden>Pautan untuk Google Review NFC: <a id="direct-review" target="_blank" rel="noopener noreferrer">Buka Google Review \u2197</a></p><a href="/subscribe/" target="_blank" rel="noopener noreferrer">Lihat semua pakej \u2197</a>
  <div id="lifecycle-actions" class="actions" ${customer2 ? "hidden" : ""}><button type="button" id="state-toggle" class="secondary">Nyahaktif</button><button type="button" id="delete-open" class="danger">Padam halaman</button><button type="button" id="state-restore" class="secondary" hidden>Pulihkan sebagai nyahaktif</button><button type="button" id="purge-open" class="danger" hidden>Padam kekal QR</button></div>
  <form id="delete-form" class="notice" hidden><p>Halaman akan disembunyikan dan akses pelanggan ditarik balik. Super admin boleh memulihkannya. Salinan rekod dikekalkan.</p><label for="delete-name">Taip nama perniagaan untuk sahkan</label><input id="delete-name" required autocomplete="off"><button class="danger">Sahkan padam</button><button id="delete-cancel" type="button" class="secondary">Batal</button></form>
  <form id="purge-form" class="notice" hidden><h3>Padam kekal QR</h3><p>URL pendek dan QR ini tidak boleh dipulihkan melalui SmartTap. Rekod pesanan, audit dan backup dalam tempoh simpanan dikekalkan. Selesaikan bayaran dan penghantaran terbuka dahulu.</p><label for="purge-name">Taip nama perniagaan yang tepat</label><input id="purge-name" required autocomplete="off"><label for="purge-id">Taip kod QR untuk sahkan</label><p id="purge-code" data-no-i18n></p><input id="purge-id" required autocomplete="off" spellcheck="false"><label class="check-label"><input id="purge-confirm" type="checkbox" required> Saya faham URL dan QR lama akan dihentikan secara kekal.</label><div class="actions"><button class="danger">Sahkan padam kekal QR</button><button type="button" id="purge-cancel" class="secondary">Batal</button></div></form>
  <p id="management-status" role="status" aria-live="polite"></p>
  <div id="billing-section"><h3>Langganan & pembayaran</h3><p id="billing-availability"></p><p id="payment-summary"></p>
  <div id="order-support" class="notice" hidden><h4>Hubungi super admin</h4><p>Satu saluran WhatsApp untuk semua pertanyaan bayaran, pesanan dan penghantaran.</p><a id="order-whatsapp" class="button" target="_blank" rel="noopener noreferrer">Hubungi admin di WhatsApp \u2197</a><p class="help">Nama perniagaan, ID pesanan jika tersedia dan mesej admin disertakan dalam draf. Semak dan hantar sendiri melalui WhatsApp.</p></div>
  <section id="gateway-panel" class="gateway-panel" hidden><h4>Pembayaran ToyyibPay</h4><p id="gateway-availability"></p><p id="gateway-order" data-no-i18n></p><p id="gateway-status" role="status" aria-live="polite"></p><div class="actions"><a id="gateway-continue" class="button" hidden>Teruskan pembayaran \u2197</a><button type="button" id="gateway-check" class="secondary" hidden>Semak status bayaran</button><button type="button" id="gateway-cancel" class="secondary" hidden>Batalkan bil belum dibayar</button></div></section><p id="renewal-reminder" class="renewal-reminder" hidden></p><div id="payment-disclosure" class="actions" hidden><button id="payment-toggle" type="button" class="secondary" aria-controls="payment-form" aria-expanded="false">Renew / beli add-on</button><span class="help">Bayaran diproses melalui ToyyibPay.</span></div>
  <form id="payment-form" hidden><label for="payment-package">Pakej</label><select id="payment-package"></select><div class="quantity-grid"><div><label for="payment-nfc">NFC tambahan \xB7 RM30/unit</label><input id="payment-nfc" type="number" min="0" max="10" step="1" value="0"></div><div><label for="payment-stickers">NFC table sticker \xB7 kuantiti</label><input id="payment-stickers" type="number" min="0" max="200" step="1" value="0"></div></div><p class="help">Sticker: RM20/unit untuk 1\u201319 unit; RM15/unit untuk 20 unit atau lebih.</p><div id="payment-quote" role="status"></div><button id="gateway-pay" type="button" hidden>Bayar dengan ToyyibPay \u2197</button><p id="gateway-pay-help" class="help" hidden>Jumlah pesanan ditetapkan oleh SmartTap. Status disahkan terus dengan ToyyibPay.</p><p class="help">Harga produk tidak termasuk penghantaran. Urus penghantaran dan cajnya secara berasingan dengan super admin.</p>
  <details id="manual-method" open><summary>Bayaran manual (QR DuitNow)</summary><div id="payment-instructions" hidden><p>Bayar jumlah di atas menggunakan QR DuitNow ini. Semak nama penerima sebelum mengesahkan bayaran dalam aplikasi bank.</p><img id="payment-qr" width="1118" height="1762" alt="Gambar penuh QR DuitNow asal \u2014 NIK AZFAR BIN NIK ZAINAL, MAE Maybank"><strong id="payment-payee"></strong><div class="actions"><a id="payment-open" class="button secondary" target="_blank" rel="noopener noreferrer">Lihat QR penuh \u2197</a><a id="payment-download" class="button secondary" download="smarttap-duitnow-asal.jpeg">Muat turun gambar QR asal</a></div></div>
  <p class="notice">Selepas membayar, hantar rujukan transaksi. Langganan dilanjutkan selepas super admin mengesahkan wang diterima. Jangan bayar semasa menggunakan demo tempatan.</p><label for="payment-reference">Rujukan transaksi bank</label><input id="payment-reference" required minlength="3" maxlength="80" autocomplete="off"><label for="payment-date">Tarikh bayaran</label><input id="payment-date" type="date" required><button id="payment-submit">Hantar untuk semakan bayaran</button></details></form>
  <form id="payment-review" hidden><h4>Semakan super admin</h4><p id="review-details"></p><label class="check-label"><input id="bank-confirm" type="checkbox"> Saya telah menyemak akaun bank dan wang benar-benar diterima untuk transaksi ini.</label><label for="review-note">Nota kepada pelanggan (pilihan)</label><input id="review-note" maxlength="200"><div class="actions"><button id="payment-approve">Sahkan bayaran</button><button type="button" id="payment-reject" class="secondary">Tolak permohonan</button></div></form></div>`;
  document.getElementById("edit-form").before(panel);
  const $2 = (id) => panel.querySelector("#" + id);
  let current = null, config = null, quote = null, sequence = 0, messageSequence = 0, gatewaySequence = 0, gatewayReturnChecked = null, working = false, paymentOpen = !customer2, paymentAvailable = false, supportOrderId = null;
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
  const subscriptionUI = createAdminSubscriptionUI({ customer: customer2, onSubmit: (data) => action("/subscription", { ...data, revision: current.revision }, "Langganan dikemas kini oleh super admin. URL dan QR kekal sama.") });
  $2("lifecycle-actions").before(subscriptionUI.panel);
  const today = () => new Date(Date.now() + 8 * 36e5).toISOString().slice(0, 10);
  const options = () => ({ package: $2("payment-package").value, extraNfcQty: Number($2("payment-nfc").value), stickerQty: Number($2("payment-stickers").value) });
  function clear() {
    $2("purge-form").hidden = true;
    supportOrderId = null;
    subscriptionUI.clear();
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
  }
  function orderSupport(item) {
    const support = orderSupportLink(item, { customer: customer2, language: document.documentElement.lang, orderId: supportOrderId });
    const visible = !!support;
    $2("order-support").hidden = !visible;
    $2("order-whatsapp").removeAttribute("href");
    if (!visible) return;
    $2("order-whatsapp").href = support.url;
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
    $2("gateway-status").textContent = checkout ? { creating: "Sedang menyediakan bil. Muat semula sebentar lagi.", pending: "Bayaran belum disahkan. Teruskan pembayaran atau semak status.", failed: "Cubaan bayaran tidak berjaya. Anda boleh mencuba semula pada bil yang sama.", paid: "Bayaran ToyyibPay disahkan.", cancelled: "Bil belum dibayar telah dibatalkan.", creation_failed: "Bil belum dapat disediakan. Anda boleh cuba semula.", review: "Bayaran diterima dan memerlukan tindakan super admin.", resolved: "Semakan selesai. Pemulangan wang di luar SmartTap telah direkodkan." }[checkout.status] || "" : "";
    const reviewable = settings.enabled && checkout && !["paid", "cancelled", "creation_failed", "resolved"].includes(checkout.status);
    $2("gateway-check").hidden = !reviewable;
    $2("gateway-cancel").hidden = !reviewable || checkout.status === "review";
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
    subscriptionUI.busy(true);
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
      subscriptionUI.busy(false);
    }
  }
  async function show(item) {
    subscriptionUI.set(item);
    const changed = current?.id !== item.id, messageChanged = current?.adminMessage?.id !== item.adminMessage?.id, oldStatus = current?.renewal?.status;
    if (changed) supportOrderId = null;
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
    $2("purge-open").hidden = customer2 || item.manualState !== "deleted";
    $2("purge-form").hidden = true;
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
    const selected2 = $2("payment-package").value, annual = hasAnnualEntitlement(item);
    $2("payment-package").replaceChildren();
    for (const product of config.packages) {
      if (product.id === "addons" && !hasEntitlement(item) || product.id !== "addons" && (annual && product.id !== "renew" || !annual && product.id === "renew")) continue;
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
    subscriptionUI.busy(true);
    onBusy(true);
    const id = current.id, version = messageSequence;
    $2("management-status").textContent = "Menyimpan\u2026";
    for (const node of panel.querySelectorAll("button,input,select,textarea")) node.disabled = true;
    try {
      const updated = await api2("/links/" + id + path, { method: "POST", body });
      if (current?.id !== id || version !== messageSequence) return;
      if (updated.permanentlyDeleted) {
        clear();
        onPurge(id);
        return;
      }
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
      subscriptionUI.busy(false);
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
  $2("purge-open").onclick = () => {
    $2("purge-form").hidden = false;
    $2("purge-name").value = "";
    $2("purge-id").value = "";
    $2("purge-confirm").checked = false;
    $2("purge-code").textContent = current.id;
    $2("purge-name").focus();
  };
  $2("purge-cancel").onclick = () => {
    $2("purge-form").hidden = true;
  };
  $2("purge-form").onsubmit = (event) => {
    event.preventDefault();
    if (customer2 || !$2("purge-form").reportValidity()) return;
    action("/purge", { revision: current.revision, confirmName: $2("purge-name").value, confirmId: $2("purge-id").value, confirmPermanent: $2("purge-confirm").checked }, "QR dipadam kekal.");
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
  return { show, clear, contact(orderId = null) {
    supportOrderId = orderId;
    if (current) orderSupport(current);
  } };
}

// src/google-listing-tools.mjs
function createGoogleListingTools({ input, name, onChange, search, lookup }) {
  const el = (tag, text2) => {
    const node = document.createElement(tag);
    if (text2) node.textContent = text2;
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
  for (const [text2, url] of [["Panduan tambah tempat di Google Maps \u2197", "https://support.google.com/maps/answer/6320846?hl=en"], ["Daftar Google Business Profile \u2197", "https://business.google.com/add"]]) {
    const a = el("a", text2);
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
function createCustomerArea({ coverNodes, detailsNodes = {}, onSelect }) {
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
  for (const [name, text2] of [["messages", "Tiada mesej baharu daripada super admin."], ["delivery", "Isi alamat dan semak status penghantaran melalui Pesanan saya. Untuk bantuan, buka Mesej."], ["gateway", "Belum ada bil pembayaran. Pilih Renew / beli untuk menyediakan pesanan."]]) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent = text2;
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
  for (const id of ["page-state", "subscription-summary", "subscription-management", "google-listing-status", "direct-review-wrap", "payment-summary", "renewal-reminder", "payment-disclosure"]) move(id, "overview");
  const orderShortcut = document.createElement("button");
  orderShortcut.type = "button";
  orderShortcut.className = "secondary";
  orderShortcut.textContent = "Buka Pesanan saya";
  orderShortcut.onclick = () => open("orders", true);
  groups.delivery.append(orderShortcut);
  const supportShortcut = document.createElement("button");
  supportShortcut.type = "button";
  supportShortcut.className = "secondary";
  supportShortcut.textContent = "Perlukan bantuan? Buka Mesej";
  supportShortcut.onclick = () => openMessages();
  groups.delivery.append(supportShortcut);
  move("admin-message-box", "messages");
  move("order-support", "messages");
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
  let confirm2 = false;
  for (const node of paymentChildren) {
    if (node.id === "payment-quote") confirm2 = true;
    (confirm2 ? checkout : cart).append(node);
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
      unit.append(label, ...detailsNodes[key] || [input]);
      if (["address", "hours"].includes(key)) unit.dataset.businessDetail = key;
      if (key === "cover") unit.append(...coverNodes);
      if (key === "google" && $2("google-pending-note")) unit.append($2("google-pending-note"));
      group.append(unit);
    }
    if (keys.includes("menu")) {
      group.classList.add("customer-catalog-details");
      group.dataset.catalogDetail = "menu";
      for (const unit of group.children) unit.dataset.catalogDetail = unit.querySelector("#field-menu") ? "menu" : "directions";
      const nav2 = document.createElement("nav");
      nav2.className = "customer-subnav catalog-details-switch";
      nav2.dataset.noI18n = "";
      nav2.setAttribute("aria-label", "Menu & location");
      for (const [id, ms, en] of [["menu", "Menu & katalog", "Menu & catalogue"], ["directions", "Lokasi", "Location"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.catalogDetail = id;
        const text2 = () => {
          let language = document.documentElement.lang;
          try {
            language = localStorage.getItem("smarttap.language") || language;
          } catch {
          }
          button.textContent = language === "en" ? en : ms;
        };
        text2();
        window.addEventListener("smarttap:language", text2);
        button.setAttribute("aria-current", id === "menu" ? "page" : "false");
        button.onclick = () => {
          group.dataset.catalogDetail = id;
          for (const b of nav2.children) b.setAttribute("aria-current", b.dataset.catalogDetail === id ? "page" : "false");
        };
        nav2.append(button);
      }
      group.prepend(nav2);
    }
    if (keys.includes("address")) {
      group.classList.add("customer-business-details");
      group.dataset.detail = "address";
      const nav2 = document.createElement("nav");
      nav2.className = "customer-subnav business-details-switch";
      nav2.setAttribute("aria-label", "Alamat dan waktu");
      for (const [id, text2] of [["address", "Alamat"], ["hours", "Waktu operasi"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text2;
        button.dataset.detail = id;
        button.setAttribute("aria-current", id === "address" ? "page" : "false");
        button.onclick = () => {
          group.dataset.detail = id;
          for (const b of nav2.children) b.setAttribute("aria-current", b.dataset.detail === id ? "page" : "false");
        };
        nav2.append(button);
      }
      group.prepend(nav2);
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
  function openMessages() {
    sectionName = "messages";
    open("package", true);
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
    for (const [name, id] of Object.entries({ messages: "admin-message-box", gateway: "gateway-panel" })) emptySections[name].hidden = !$2(id).hidden;
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
      const detail = invalid.closest("[data-business-detail]");
      if (detail) {
        const group = detail.closest(".customer-business-details");
        group.dataset.detail = detail.dataset.businessDetail;
        for (const button of group.querySelectorAll(".business-details-switch button")) button.setAttribute("aria-current", button.dataset.detail === group.dataset.detail ? "page" : "false");
      }
      const catalogDetail = invalid.closest(".customer-field[data-catalog-detail]");
      if (catalogDetail) {
        const group = catalogDetail.closest(".customer-catalog-details");
        group.dataset.catalogDetail = catalogDetail.dataset.catalogDetail;
        for (const b of group.querySelectorAll(".catalog-details-switch button")) b.setAttribute("aria-current", b.dataset.catalogDetail === group.dataset.catalogDetail ? "page" : "false");
      }
      invalid.focus();
      invalid.reportValidity();
    }
  }, true);
  $2("cancel").addEventListener("click", () => open("my"));
  return { focusField(key) {
    for (const [name, sections] of Object.entries(pages)) {
      const index = sections.findIndex((node) => node.querySelector("#field-" + key));
      if (index >= 0) {
        view = name;
        activeTab[name] = index;
        const group = sections[index];
        if (group.classList.contains("customer-catalog-details")) {
          group.dataset.catalogDetail = "menu";
          for (const b of group.querySelectorAll(".catalog-details-switch button")) b.setAttribute("aria-current", b.dataset.catalogDetail === "menu" ? "page" : "false");
        }
        render2();
        break;
      }
    }
  }, update(item) {
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
  }, open, openMessages };
}

// src/page-history.mjs
function createPageHistoryUI({ api: api2, onUpdated = () => {
}, canMutate = () => true }) {
  const el = (tag, text2) => {
    const node = document.createElement(tag);
    if (text2) node.textContent = text2;
    return node;
  };
  const panel = el("section");
  panel.className = "card page-history";
  panel.hidden = true;
  const title = el("h3", "Sejarah & pemulihan kandungan");
  const help = el("p", "Pulihkan maklumat perniagaan, paparan dan katalog daripada versi terdahulu. URL dan QR kekal sama. Gmail pemilik, langganan, bayaran, pesanan dan status halaman tidak dipulihkan.");
  help.className = "help";
  const toggle = el("button", "Lihat sejarah");
  toggle.type = "button";
  toggle.className = "secondary";
  toggle.setAttribute("aria-expanded", "false");
  const body = el("div");
  body.hidden = true;
  const actions = el("div");
  actions.className = "actions";
  const refresh = el("button", "Muat semula sejarah"), more = el("button", "Versi lain");
  for (const button of [refresh, more]) {
    button.type = "button";
    button.className = "secondary";
  }
  more.hidden = true;
  actions.append(refresh, more);
  const status = el("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const form = el("form");
  form.noValidate = true;
  const picker = el("select");
  picker.id = "page-history-source";
  const pickerLabel = el("label", "Versi untuk dipulihkan");
  pickerLabel.htmlFor = picker.id;
  const details = el("p");
  details.className = "help";
  details.dataset.noI18n = "";
  const warning = el("p", "Pemulihan menggantikan kandungan semasa, termasuk suntingan yang belum disimpan. Semak versi dan nama perniagaan sebelum meneruskan.");
  warning.className = "notice";
  const name = el("input");
  name.id = "page-history-confirm-name";
  name.maxLength = 80;
  name.autocomplete = "off";
  name.required = true;
  const nameLabel = el("label", "Taip nama perniagaan semasa untuk mengesahkan");
  nameLabel.htmlFor = name.id;
  const note = el("textarea");
  note.id = "page-history-note";
  note.maxLength = 200;
  note.rows = 2;
  note.required = true;
  const noteLabel = el("label", "Sebab pemulihan (maksimum 200 aksara)");
  noteLabel.htmlFor = note.id;
  const confirmation = el("input");
  confirmation.id = "page-history-confirm";
  confirmation.type = "checkbox";
  const confirmationLabel = el("label");
  confirmationLabel.htmlFor = confirmation.id;
  confirmationLabel.append(confirmation, document.createTextNode(" Saya telah menyemak versi dan mahu menggantikan kandungan semasa."));
  const restore = el("button", "Pulihkan versi dipilih");
  restore.type = "submit";
  form.append(pickerLabel, picker, details, warning, nameLabel, name, noteLabel, note, confirmationLabel, restore);
  body.append(actions, status, form);
  panel.append(title, help, toggle, body);
  let page = null, items = [], cursor2 = null, working = false, locked = false, sequence = 0;
  const allowed = () => !!page && !working && !locked && canMutate() && page.manualState !== "deleted" && page.state !== "deleted";
  const path = () => "/api/admin/links/" + encodeURIComponent(page.id) + "/history";
  const date4 = (value) => value ? new Date(value).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" }) : "Tarikh tidak tersedia";
  function controls() {
    toggle.disabled = !page || working || locked;
    refresh.disabled = working || locked;
    more.disabled = working || locked;
    picker.disabled = working || locked || !items.length;
    for (const input of [name, note, confirmation]) input.disabled = !allowed();
    restore.disabled = !allowed() || !items.find((item) => item.revision === picker.value)?.restorable;
    form.hidden = !items.length;
  }
  function selected2() {
    const item = items.find((item2) => item2.revision === picker.value);
    details.textContent = item ? "Versi " + item.revision + " \xB7 " + date4(item.archivedAt || item.updatedAt) + (item.changedBy ? " \xB7 " + item.changedBy : "") + (item.restorable ? "" : " \xB7 Versi ini tidak sah dan tidak boleh dipulihkan.") : "Pilih versi dahulu.";
    confirmation.checked = false;
    controls();
  }
  async function load2(append = false) {
    if (!page || working || locked) return;
    const current = sequence;
    working = true;
    controls();
    status.textContent = "Memuatkan sejarah\u2026";
    try {
      const result = await api2(path() + (append && cursor2 ? "?cursor=" + encodeURIComponent(cursor2) : ""));
      if (current !== sequence) return;
      if (result.revision !== page.revision) {
        status.textContent = "Halaman telah berubah. Muat semula halaman sebelum memulihkan kandungan.";
        items = [];
        picker.replaceChildren();
        more.hidden = true;
        return;
      }
      items = append ? [...items, ...result.items.filter((item) => !items.some((old) => old.revision === item.revision))] : result.items;
      cursor2 = result.cursor;
      more.hidden = !cursor2;
      const previous = picker.value;
      picker.replaceChildren();
      for (const item of items) {
        const option = el("option", date4(item.archivedAt || item.updatedAt) + " \xB7 " + item.name + " \xB7 #" + item.revision + (item.restorable ? "" : " \xB7 Tidak sah"));
        option.value = item.revision;
        option.disabled = !item.restorable;
        picker.append(option);
      }
      picker.value = items.some((item) => item.revision === previous && item.restorable) ? previous : items.find((item) => item.restorable)?.revision || "";
      selected2();
      status.textContent = items.length ? "Sejarah dimuatkan. Pilih versi dan lengkapkan pengesahan untuk memulihkan kandungan." : "Belum ada versi terdahulu untuk halaman ini.";
    } catch (error) {
      if (current === sequence) status.textContent = error.message || "Sejarah belum dapat dimuatkan.";
    } finally {
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  }
  toggle.onclick = () => {
    body.hidden = !body.hidden;
    toggle.setAttribute("aria-expanded", String(!body.hidden));
    toggle.textContent = body.hidden ? "Lihat sejarah" : "Tutup sejarah";
    if (!body.hidden && !items.length) load2();
  };
  refresh.onclick = () => load2();
  more.onclick = () => load2(true);
  picker.onchange = selected2;
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!allowed()) return;
    const chosen = items.find((item) => item.revision === picker.value);
    if (!chosen?.restorable) {
      status.textContent = "Pilih versi yang sah dahulu.";
      return;
    }
    if (name.value !== page.profile.name) {
      status.textContent = "Nama perniagaan mesti sama tepat dengan nama semasa.";
      name.focus();
      return;
    }
    const reason = note.value.trim();
    if (!reason || reason.length > 200 || /[\u0000-\u001f]/.test(reason)) {
      status.textContent = "Masukkan sebab pemulihan yang sah, maksimum 200 aksara.";
      note.focus();
      return;
    }
    if (!confirmation.checked) {
      status.textContent = "Tandakan pengesahan sebelum memulihkan kandungan.";
      confirmation.focus();
      return;
    }
    const current = sequence;
    working = true;
    controls();
    status.textContent = "Memulihkan kandungan\u2026";
    try {
      const result = await api2(path() + "/restore", { method: "POST", body: { sourceRevision: chosen.revision, revision: page.revision, note: reason } });
      if (current !== sequence) return;
      page = result;
      items = [];
      cursor2 = null;
      picker.replaceChildren();
      name.value = "";
      note.value = "";
      confirmation.checked = false;
      more.hidden = true;
      status.textContent = "Kandungan berjaya dipulihkan. URL, QR dan maklumat langganan kekal.";
      await onUpdated(result);
    } catch (error) {
      if (current === sequence) status.textContent = error.status === 409 ? "Halaman telah berubah atau belum boleh dipulihkan. Muat semula halaman dan semak sebelum mencuba lagi." : error.message || "Kandungan belum dapat dipulihkan.";
    } finally {
      if (current === sequence) {
        working = false;
        controls();
      }
    }
  };
  return { panel, show(item) {
    if (page?.id === item.id && page.revision === item.revision) {
      page = item;
      controls();
      return;
    }
    sequence++;
    page = item;
    items = [];
    cursor2 = null;
    working = false;
    panel.hidden = false;
    body.hidden = true;
    toggle.textContent = "Lihat sejarah";
    toggle.setAttribute("aria-expanded", "false");
    picker.replaceChildren();
    details.textContent = "";
    name.value = "";
    note.value = "";
    confirmation.checked = false;
    status.textContent = "";
    more.hidden = true;
    controls();
  }, clear() {
    sequence++;
    page = null;
    items = [];
    cursor2 = null;
    working = false;
    panel.hidden = true;
    body.hidden = true;
    picker.replaceChildren();
    details.textContent = "";
    name.value = "";
    note.value = "";
    confirmation.checked = false;
    status.textContent = "";
    controls();
  }, lock(value) {
    locked = !!value;
    controls();
  } };
}

// src/admin.js
var $ = (id) => document.getElementById(id);
var customer = document.body.dataset.role === "user";
var base = customer ? "/api/user" : "/api/admin";
var endpoint = location.hostname === "127.0.0.1" ? location.origin : window.SMARTTAP_IMPORT_CONFIG?.endpoint;
var fields = { name: "Nama perniagaan", logo: "URL logo", tagline: "Penerangan ringkas", google: "Google Review", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", threads: "Threads", phone: "Telefon perniagaan", whatsapp: "WhatsApp", website: "Laman web", ...Object.fromEntries(Object.entries(appearanceFields).map(([key, spec]) => [key, spec.label])) };
var listingTools = null;
var businessDetails = null;
var appearanceControls = null;
var catalogEditor = null;
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
  businessDetails?.lock(value || customer && selected?.state !== "active");
  appearanceControls?.lock(value || customer && selected?.state !== "active");
  catalogEditor?.lock(value || customer && selected?.state !== "active");
  historyUI?.lock(value);
}
var historyUI = null;
var management = createManagementUI({ customer, onPurge: (id) => {
  records = records.filter((item) => item.id !== id);
  selected = null;
  ordersUI.clear();
  historyUI?.clear();
  $("editor").hidden = true;
  render();
  alerts?.refresh();
  $("list-status").textContent = "QR dipadam kekal. URL lama tidak lagi tersedia.";
}, api: (path, options) => api(base + path, options), onBusy: lockControls, onUpdate: (item) => {
  selected = item;
  records = records.map((record) => record.id === item.id ? item : record);
  render();
  historyUI?.show(item);
  alerts?.refresh();
  customerArea?.update(item);
  ordersUI.show(item);
  $("edit-title").textContent = item.profile.name;
  if ($("public-sharing")) $("public-sharing").hidden = item.state === "nfc_only" || item.state === "deleted";
} });
var ordersUI = createOrdersUI({ customer, onContact: (orderId) => {
  if (saving) return;
  management.contact(orderId);
  customerArea?.openMessages();
}, api: (path, options) => api(base + path, options), canMutate: () => !saving, onBusy: lockControls, onOrderChanged: () => alerts?.refresh(), onPageUpdated: async (item) => {
  selected = item;
  records = records.map((record) => record.id === item.id ? item : record);
  render();
  await management.show(item);
  historyUI?.show(item);
} });
$("edit-form").before(ordersUI.panel);
historyUI = customer ? null : createPageHistoryUI({ api, canMutate: () => !saving, onUpdated: async (item) => {
  records = records.map((record) => record.id === item.id ? item : record);
  render();
  await edit(item);
} });
if (historyUI) $("edit-form").after(historyUI.panel);
var alerts = customer ? null : createPaymentAlerts({ api, open: async (id, orderId) => {
  if (saving) return;
  const current = session;
  const item = await api(base + "/links/" + id);
  if (current !== session || saving) return;
  await edit(item, orderId);
  if (orderId) ordersUI.panel.scrollIntoView({ behavior: "smooth", block: "start" });
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
  historyUI?.clear();
  alerts?.stop();
  customerArea?.clear();
  $("dashboard").hidden = true;
  $("editor").hidden = true;
  $("login-panel").hidden = false;
  $("records").replaceChildren();
  for (const field of Object.keys(fields)) $("field-" + field).value = "";
  businessDetails?.set({});
  appearanceControls?.set();
  catalogEditor?.clear();
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
async function edit(item, orderId) {
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
  businessDetails?.set(item.profile);
  appearanceControls?.set();
  catalogEditor?.set({ ...item, mediaOrigin: new URL(endpoint).origin });
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
  ordersUI.show(item, orderId);
  historyUI?.show(item);
  customerArea?.update(item);
}
for (const [key, text2] of Object.entries(fields)) {
  const label = document.createElement("label");
  label.htmlFor = "field-" + key;
  label.textContent = text2 + (["name", "google"].includes(key) ? " *" : "");
  const spec = appearanceFields[key];
  const multiline = ["address", "promoText"].includes(key);
  const input = document.createElement(spec?.options ? "select" : multiline ? "textarea" : "input");
  input.id = "field-" + key;
  input.name = key;
  input.maxLength = spec?.max || (key === "name" ? 80 : key === "tagline" ? 140 : key === "phone" ? 30 : 500);
  if (spec?.options) for (const [value, text3] of Object.entries(spec.options)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text3;
    input.append(option);
  }
  if (["name", "google"].includes(key)) input.required = true;
  if (!spec && !["name", "tagline", "phone"].includes(key)) {
    input.type = "url";
    input.placeholder = "https://";
  }
  if (multiline) input.rows = 3;
  if (spec && !spec.options && !multiline) {
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
businessDetails = createBusinessDetails({ addressInput: $("field-address"), hoursInput: $("field-hours"), onChange: () => {
  $("save-status").textContent = "Ada perubahan yang belum disimpan.";
} });
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
  appearanceControls?.coverSelected(null);
  $("save-status").textContent = "Ada perubahan yang belum disimpan.";
});
$("field-cover").after(coverLabel, coverFile, coverHelp, coverPreview, removeCover, coverStatus);
appearanceControls = createAppearanceControls({ onChange: () => {
  $("save-status").textContent = "Ada perubahan yang belum disimpan.";
} });
coverStatus.after(...appearanceControls.coverNodes);
catalogEditor = createCatalogEditor({ onChange: () => {
  $("save-status").textContent = "Ada perubahan yang belum disimpan.";
}, upload: async (file) => {
  const item = selected, current = session;
  if (!item || saving) throw new Error("Sila buka halaman semula.");
  lockControls(true);
  try {
    const response = await fetch(new URL(base + "/links/" + item.id + "/catalog-image", endpoint), { method: "POST", headers: { Authorization: "Bearer " + credential, "Content-Type": file.type, "If-Match": item.revision }, body: file, cache: "no-store", credentials: "omit" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gambar belum dapat disimpan.");
    if (current !== session || selected?.id !== item.id) throw new Error("Sesi telah berubah.");
    selected = result.page;
    records = records.map((record) => record.id === selected.id ? selected : record);
    render();
    historyUI?.show(result.page);
    return result;
  } finally {
    lockControls(false);
  }
}, loadImage: async (url) => {
  const item = selected, current = session;
  if (!item) throw new Error("Sesi tamat.");
  const name = new URL(url).pathname.split("/").at(-1);
  const response = await fetch(new URL(base + "/links/" + item.id + "/catalog-image/" + name, endpoint), { headers: { Authorization: "Bearer " + credential }, cache: "no-store", credentials: "omit" });
  if (!response.ok || current !== session || selected?.id !== item.id) throw new Error("Gambar tidak tersedia.");
  return response.blob();
} });
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
    historyUI?.show(updated);
    $("field-cover").value = updated.profile.cover;
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);
    coverPreview.src = previewURL;
    coverPreview.hidden = false;
    coverStatus.textContent = "Cover telah disimpan. URL pendek dan QR kekal sama.";
    appearanceControls?.coverSelected(file);
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
  let catalog;
  try {
    catalog = catalogEditor?.draft();
  } catch (error) {
    $("save-status").textContent = error.message;
    customerArea?.focusField("menu");
    return;
  }
  const item = selected, current = session;
  const profile = { v: 1 };
  for (const key of Object.keys(fields)) profile[key] = $("field-" + key).value.normalize("NFC").trim();
  listingTools?.apply(profile);
  if (customer && item.profile.googleStatus === "pending") {
    profile.google = "";
    profile.googleStatus = "pending";
  }
  if (malaysiaPhone(profile.phone)) profile.phone = malaysiaPhone(profile.phone);
  businessDetails?.lock(true);
  appearanceControls?.lock(true);
  catalogEditor?.lock(true);
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
    const updated = await api(base + "/links/" + item.id, { method: "PUT", body: { profile, revision: item.revision, ...catalog ? { catalog } : {} } });
    if (current !== session) return;
    records = records.map((record) => record.id === updated.id ? updated : record);
    selected = updated;
    render();
    historyUI?.show(updated);
    customerArea?.update(updated);
    $("edit-title").textContent = updated.profile.name;
    for (const key of Object.keys(fields)) $("field-" + key).value = updated.profile[key] || (key === "theme" ? "classic" : key === "accent" ? "#20543e" : "");
    businessDetails?.set(updated.profile);
    appearanceControls?.set();
    catalogEditor?.set({ ...updated, mediaOrigin: new URL(endpoint).origin });
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
    businessDetails?.lock(customer && selected?.state !== "active");
    appearanceControls?.lock(customer && selected?.state !== "active");
    catalogEditor?.lock(customer && selected?.state !== "active");
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
    historyUI?.show(updated);
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
if (customer) customerArea = createCustomerArea({ detailsNodes: { ...businessDetails.nodes, ...appearanceControls.nodes }, coverNodes: [coverLabel, coverFile, coverHelp, coverPreview, removeCover, coverStatus, ...appearanceControls.coverNodes], onSelect: async (id) => {
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
