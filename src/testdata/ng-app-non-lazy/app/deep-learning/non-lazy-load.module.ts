import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { DeepLearningComponent } from './deep-learning.component';

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
