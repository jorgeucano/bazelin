import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-component2',
  template: `<div>Component2 work!</div>`
})
export class Component2Component implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('component2');
  }

}
