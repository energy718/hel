/**
 * 参数相关服务
 */
import * as core from '../deps/helMicroCore';
import { getDefaultPlatform } from '../deps/plat';
import type { IGetOptionsLoose, IGroupedStyleList, IPlatAndVer } from '../types';

/**
 * 推导当前应用的平台与版本
 * 调用者需自己确保版本数据已获取，即 preFetchApp 或 preFetchLib 已调用结束
 */
export function getPlatAndVer(appName: string, options?: IGetOptionsLoose): IPlatAndVer {
  const { platform, versionId } = options || {};
  let ver = versionId || '';
  if (!versionId) {
    const versionData = core.getVersion(appName, { platform });
    if (versionData) {
      // 已存在了正在运行的版本数据
      ver = versionData.sub_app_version;
    } else {
      const appMeta = core.getAppMeta(appName, platform);
      ver = appMeta?.online_version || appMeta?.build_version || '';
    }
  }

  return {
    platform: getDefaultPlatform(platform),
    versionId: ver,
  };
}

export function getGroupedStyleList(appName: string, options?: IGetOptionsLoose): IGroupedStyleList {
  const map: IGroupedStyleList = {
    static: [],
    build: [],
  };
  const version = core.getVersion(appName, options);
  if (version) {
    const { webDirPath, chunkCssSrcList } = version.src_map;
    chunkCssSrcList.forEach((src) => {
      src.startsWith(webDirPath) ? map.build.push(src) : map.static.push(src);
    });
  }
  return map;
}
