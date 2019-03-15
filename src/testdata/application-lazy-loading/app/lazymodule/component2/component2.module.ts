import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Component2Component } from './component2.component';
import { Component2RoutingModule } from './component2-routing.module';

@NgModule({
  imports: [
    CommonModule,
    Component2RoutingModule
  ],
  declarations: [
    Component2Component,
  ],
})
export class Component2Module {
}
