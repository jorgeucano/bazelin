import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-component1',
  template: `<div>Component1 work!</div>`,
})
export class Component1Component implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('component1');
  }

}
