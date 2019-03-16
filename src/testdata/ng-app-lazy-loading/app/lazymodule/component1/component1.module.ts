import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Component1RoutingModule } from './component1-routing.module';
import { Component1Component } from './component1.component';

@NgModule({
  imports: [
    CommonModule,
    Component1RoutingModule
  ],
  declarations: [
    Component1Component
  ]
})
export class Component1Module {
}
