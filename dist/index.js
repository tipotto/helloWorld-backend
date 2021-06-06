"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFetchSupportedLangs = exports.onTranslateTexts = exports.onUpdateReadStatus = exports.onCreateMessage = exports.onSearchChannels = exports.onUnfollowOrDeleteChannel = exports.onUpdateChannel = exports.onCreateOrJoinChannel = void 0;
const common_1 = require("./common");
Object.defineProperty(exports, "onTranslateTexts", { enumerable: true, get: function () { return common_1.onTranslateTexts; } });
Object.defineProperty(exports, "onFetchSupportedLangs", { enumerable: true, get: function () { return common_1.onFetchSupportedLangs; } });
const channel_1 = require("./channel");
Object.defineProperty(exports, "onCreateOrJoinChannel", { enumerable: true, get: function () { return channel_1.onCreateOrJoinChannel; } });
Object.defineProperty(exports, "onUpdateChannel", { enumerable: true, get: function () { return channel_1.onUpdateChannel; } });
Object.defineProperty(exports, "onUnfollowOrDeleteChannel", { enumerable: true, get: function () { return channel_1.onUnfollowOrDeleteChannel; } });
Object.defineProperty(exports, "onSearchChannels", { enumerable: true, get: function () { return channel_1.onSearchChannels; } });
const message_1 = require("./message");
Object.defineProperty(exports, "onCreateMessage", { enumerable: true, get: function () { return message_1.onCreateMessage; } });
Object.defineProperty(exports, "onUpdateReadStatus", { enumerable: true, get: function () { return message_1.onUpdateReadStatus; } });
//# sourceMappingURL=index.js.map