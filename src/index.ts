import { onTranslateTexts, onFetchSupportedLangs } from './common';
import {
  onCreateOrJoinChannel,
  onUpdateChannel,
  onUnfollowOrDeleteChannel,
  onSearchChannels,
} from './channel';
import { onCreateMessage, onUpdateReadStatus } from './message';

// メインファイル（index.ts）で各モジュールを読み込まないと使えない？
// 他のファイルでimportすることはないため、exportの必要はない？
export {
  onCreateOrJoinChannel,
  onUpdateChannel,
  onUnfollowOrDeleteChannel,
  onSearchChannels,
  onCreateMessage,
  onUpdateReadStatus,
  onTranslateTexts,
  onFetchSupportedLangs,
};
