import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'component1',
    loadChildren: './lazymodule/component1/component1.module#Component1Module'
  },
  {
    path: 'component2',
    loadChildren: './lazymodule/component2/component2.module#Component2Module'
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
