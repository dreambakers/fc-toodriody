import { Component, OnInit } from '@angular/core';
import { DialogService } from '../services/dialog.service';
import { Router } from '@angular/router';
import { EmitterService } from '../services/emitter.service';
import { constants } from '../app.constants';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  rules;

  constructor(
    private dialogService: DialogService,
    private router: Router,
    private emitterService: EmitterService
  ) { }

  ngOnInit(): void {
    this.rules = localStorage.getItem('rules') ? JSON.parse(localStorage.getItem('rules')) : [];
  }

  createFlow() {
    this.dialogService.createFlow();
  }

  gotoRule(rule) {
    this.router.navigate(['flow']).then(() => {
      setTimeout( () => {
        this.emitterService.emit(constants.emitterKeys.createFlow, rule);
      }, 10);
    });
  }

}