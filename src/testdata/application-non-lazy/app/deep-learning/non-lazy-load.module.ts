import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeepLearningComponent } from './deep-learning.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'deep-learning', component: DeepLearningComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    DeepLearningComponent
  ],
  declarations: [
    DeepLearningComponent
  ]
})
export class NonLazyLoadModule {
  
}
