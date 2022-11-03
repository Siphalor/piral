import type { ForeignComponent, BaseComponentProps, Disposable } from 'piral-core';
import type { NgModuleDefiner, NgModuleInt } from './types';
import { BehaviorSubject } from 'rxjs';
import { NgExtension } from './NgExtension';
import { enqueue } from './queue';
import { defineModule } from './module';
import { bootstrap } from './bootstrap';
import { startup } from './startup';

export interface NgConverterOptions {}

export interface NgConverter {
  <TProps extends BaseComponentProps>(component: any): ForeignComponent<TProps>;
  defineModule: NgModuleDefiner;
  Extension: any;
}

interface NgState<TProps> {
  queued: Promise<void | Disposable>;
  props: BehaviorSubject<TProps>;
  active: boolean;
}

export function createConverter(_: NgConverterOptions = {}): NgConverter {
  let angular: Promise<NgModuleInt>;

  const convert = <TProps extends BaseComponentProps>(component: any): ForeignComponent<TProps> => ({
    mount(el, props, ctx, locals: NgState<TProps>) {
      if (!angular) {
        angular = startup(ctx);
      }

      locals.active = true;
      locals.props = new BehaviorSubject(props);
      locals.queued = Promise.resolve();

      locals.queued = locals.queued.then(() =>
        enqueue(() => locals.active && bootstrap(angular, props.piral, component, el, locals.props)),
      );
    },
    update(el, props, ctx, locals: NgState<TProps>) {
      locals.props.next(props);
    },
    unmount(el, locals: NgState<TProps>) {
      locals.active = false;
      locals.queued = locals.queued.then((dispose) => dispose && dispose());
    },
  });
  convert.defineModule = defineModule;
  convert.Extension = NgExtension;
  return convert;
}
