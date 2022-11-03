import type { PiletApi } from 'piral-core';
import type { BehaviorSubject } from 'rxjs';
import { BrowserModule } from '@angular/platform-browser';
import {
  ApplicationRef,
  Compiler,
  ComponentRef,
  CUSTOM_ELEMENTS_SCHEMA,
  Injector,
  NgModule,
  NgZone,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { RoutingService } from './RoutingService';
import { SharedModule } from './SharedModule';
import { getModuleInstance } from './module';

@NgModule({
  bootstrap: [],
  imports: [
    BrowserModule,
    SharedModule,
    RouterModule.forRoot([]),
  ],
  providers: [RoutingService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BootstrapModule {
  private appRef: ApplicationRef;
  private refs: Array<[any, HTMLElement, ComponentRef<any>]> = [];

  constructor(
    public routing: RoutingService,
    private zone: NgZone,
    private compiler: Compiler,
    private injector: Injector,
  ) {}

  ngDoBootstrap(appRef: ApplicationRef) {
    this.appRef = appRef;
  }

  async attach(piral: PiletApi, component: any, node: HTMLElement, $props: BehaviorSubject<any>) {
    const module = getModuleInstance(component, true);
    const moduleFactory = await this.compiler.compileModuleAsync(module);
    const props = { current: undefined as BehaviorSubject<any> };
    const childInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: 'Props', useFactory: () => props.current.value, deps: [] },
        { provide: 'piral', useFactory: () => piral, deps: [] },
      ],
    });
    const moduleRef = moduleFactory.create(childInjector);
    const factory = moduleRef.componentFactoryResolver.resolveComponentFactory(component);
    props.current = $props;

    if (factory) {
      const ref = this.zone.run(() => this.appRef.bootstrap<any>(factory, node));
      const name = (ref.componentType as any)?.ɵcmp?.inputs?.Props;

      if (typeof name === 'string') {
        const sub = $props.subscribe((props) => {
          ref.setInput(name, props);
        });
        ref.onDestroy(() => sub.unsubscribe());
      }

      this.refs.push([component, node, ref]);
    }
  }

  detach(component: any, node: HTMLElement) {
    for (let i = this.refs.length; i--; ) {
      const [sourceComponent, sourceNode, ref] = this.refs[i];

      if (sourceComponent === component && sourceNode === node) {
        ref.destroy();
        this.refs.splice(i, 1);
      }
    }
  }
}

RouterModule.forRoot = RouterModule.forChild;
