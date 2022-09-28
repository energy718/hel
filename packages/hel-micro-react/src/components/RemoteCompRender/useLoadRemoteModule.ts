import { appStyleSrv, logicSrv } from 'hel-micro';
import React from 'react';
import * as baseShareHooks from '../../hooks/share';
import type { IInnerRemoteModuleProps } from '../../types';
import BuildInSkeleton from '../BuildInSkeleton';
import * as share from '../share';

function judgeFetchStyleStr(appName: string, props: IInnerRemoteModuleProps) {
  const styleStr = appStyleSrv.getStyleStr(appName, props);
  const isStyleFetched = appStyleSrv.isStyleFetched(appName, props);
  // 设置了需要设置样式为字符串格式 且 无样式字符串 且 样式字符串还未异步抓取到
  // 则需要异步获取样式字符串串
  const shouldFetchStyle = (props.setStyleAsString || props.needStyleStr) && !styleStr && !isStyleFetched;
  return shouldFetchStyle;
}

function getUserCustomizedComp(props: IInnerRemoteModuleProps) {
  return {
    RemoteModule: props.Component,
    styleStr: props.handleStyleStr?.('') || '',
    styleUrlList: [],
    moduleReady: false,
  };
}

function getRemoteModule(appName: string, props: IInnerRemoteModuleProps, passCtx: { [key: string]: any }) {
  const { isLib, compName } = props;
  const emitApp = logicSrv.getLibOrApp(appName, props);

  // 获取的是 libReady 弹射出去的组件
  if (isLib) {
    if (!emitApp) {
      return null;
    }
    const libRoot: Record<string, any> = emitApp.appProperties || {};
    // 不传子组件名称， 表示返回的是 libReady 弹出的根模块
    if (!compName) {
      return libRoot;
    }
    const libComp = libRoot[compName];
    if (!libComp) {
      passCtx.setErrMsg(`comp [${compName}] not exist`);
    }
    return libComp;
  }

  return emitApp?.Comp;
}

export default function useLoadRemoteModule(props: IInnerRemoteModuleProps) {
  const appName = props.name;
  const forceUpdate = baseShareHooks.useForceUpdate();
  const [errMsg, setErrMsg] = React.useState('');
  const isLoadAppDataExecutingRef = React.useRef(false);
  const isLoadAppStyleExecutingRef = React.useRef(false);

  return {
    getModule: () => {
      const SkeletonView = props.Skeleton || BuildInSkeleton;
      const passCtx = { isLoadAppDataExecutingRef, isLoadAppStyleExecutingRef, setErrMsg, SkeletonView, forceUpdate };

      // 存在自定义组件
      if (props.Component) {
        return getUserCustomizedComp(props);
      }

      // 拉取模块过程中产生错误
      if (errMsg) {
        return share.getErrResult(props, errMsg);
      }

      // 模块还未缓存，是首次获取
      const RemoteModule = getRemoteModule(appName, props, passCtx);
      if (!RemoteModule) {
        return share.fetchRemoteModule(props, passCtx);
      }

      // 组件已获取完毕，如需获取样式字符串，则继续执行 fetchRemoteAppStyle
      const shouldFetchStyleStr = judgeFetchStyleStr(appName, props);
      if (shouldFetchStyleStr) {
        return share.fetchRemoteModuleStyle(props, passCtx);
      }

      // 设置了需要附加 css 列表，则返回对象里包含具体的 styleUrlList
      const styleUrlList = appStyleSrv.getStyleUrlList(appName, props);
      const styleStr = appStyleSrv.getStyleStr(appName, props);
      return { RemoteModule, styleStr, styleUrlList, moduleReady: true };
    },
    errMsg,
  };
}
