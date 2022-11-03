import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { findComponents, getAnnotations } from './utils';

interface ModuleDefinition {
  module: any;
  components: Array<any>;
}

const availableModules: Array<ModuleDefinition> = [];

export function getModuleInstance(component: any, skipWarning: boolean) {
  const moduleDef = availableModules.find((m) => m.components.includes(component));

  if (moduleDef) {
    return moduleDef.module;
  }

  if (process.env.NODE_ENV === 'development') {
    if (!skipWarning) {
      console.warn(
        'Component not found in all defined Angular modules. Make sure to define (using `defineNgModule`) a module with your component(s) referenced in the exports section of the `@NgModule` decorator.',
        component,
      );
    }
  }

  return undefined;
}

export function createModuleInstance(component: any, standalone: boolean) {
  const declarations = standalone ? [] : [component];
  const importsDef = standalone ? [CommonModule, component] : [CommonModule];
  const exportsDef = [component];
  const schemasDef = [CUSTOM_ELEMENTS_SCHEMA];

  @NgModule({
    declarations,
    imports: importsDef,
    exports: exportsDef,
    schemas: schemasDef,
  })
  class Module {}

  defineModule(Module);
}

export function defineModule(module: any) {
  const [annotation] = getAnnotations(module);
  availableModules.push({
    components: findComponents(annotation.exports),
    module,
  });
}
