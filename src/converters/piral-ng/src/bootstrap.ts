import type { BaseComponentProps, Disposable, PiletApi } from 'piral-core';
import type { BehaviorSubject } from 'rxjs';
import type { NgModuleInt } from './types';
import { getAnnotations } from './utils';
import { createModuleInstance, getModuleInstance, defineModule } from './module';

const registry = new Map<any, any>();

function prepareBootstrap(moduleOrComponent: any) {
  const [annotation] = getAnnotations(moduleOrComponent);
  const standalone = annotation?.standalone;

  // first way is to directly use a module, which is the legacy way
  // second way is to find a previously defined Angular module
  if (annotation && annotation.bootstrap) {
    // usually contains things like imports, exports, declarations, ...
    const [component] = annotation.bootstrap;
    annotation.exports = [component];
    defineModule(moduleOrComponent);
    return component;
  } else if (!getModuleInstance(moduleOrComponent, standalone)) {
    // usually contains things like selector, template or templateUrl, changeDetection, ...
    createModuleInstance(moduleOrComponent, standalone);
  }

  return moduleOrComponent;
}

export async function bootstrap<TProps extends BaseComponentProps>(
  angular: Promise<NgModuleInt>,
  piral: PiletApi,
  moduleOrComponent: any,
  node: HTMLElement,
  props: BehaviorSubject<TProps>,
): Promise<Disposable> {
  const ref = await angular;

  if (!registry.has(moduleOrComponent)) {
    registry.set(moduleOrComponent, prepareBootstrap(moduleOrComponent));
  }

  if (ref) {
    const component = registry.get(moduleOrComponent);
    ref.instance.attach(piral, component, node, props);
    return () => ref.instance.detach(component, node);
  }

  return () => {};
}
