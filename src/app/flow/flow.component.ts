import { Component, OnInit } from '@angular/core';
import { constants } from '../app.constants';
import { EmitterService } from '../services/emitter.service';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { Layout, Edge, Node } from '@swimlane/ngx-graph';
import { DagreNodesOnlyLayout } from './customDagreNodesOnly';
import { stepRound } from './customStepCurved';
import * as moment from 'moment';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
})
export class FlowComponent implements OnInit {
  destroy$: Subject<boolean> = new Subject<boolean>();
  constants = constants;
  flow;
  update$: Subject<any> = new Subject();
  selectedIndex = 0;
  icon = true;
  adding = '';
  flowNameEdit = false;
  showSuccessMsg = false;
  filteredTransformations;

  public curve: any = stepRound;
  public layout: Layout = new DagreNodesOnlyLayout();

  transformations = [
    {
      id: 1,
      title: 'Scale to min max',
      description: 'Scale a column to specific min max range',
    },
    {
      id: 2,
      title: 'One hot encode',
      description:
        'Create a column for each unique value indicationg its presence',
    },
    {
      id: 3,
      title: 'Scale to mean',
      description: 'Scale a column to zero mean and unit variance',
    },
  ];

  selectedDataset;

  constructor(private router: Router, private emitterService: EmitterService) {}

  ngOnInit(): void {
    this.emitterService.emitter
      .pipe(takeUntil(this.destroy$))
      .subscribe((emitted) => {
        switch (emitted.event) {
          case constants.emitterKeys.createFlow:
            this.flow = emitted.data;
            this.selectedDataset = this.flow?.nodes?.[0];
            return;
        }
      });

    // temporary work around, until we have the API developed
    setTimeout(() => {
      if (!this.flow) {
        this.router.navigate(['']);
      }
    }, 500);
  }

  addNewNode() {
    this.flow = {
      ...this.flow,
      nodes: [
        {
          id: '0',
          label: 'Rule 1',
          actions:[],
          checks: [],
          updated: moment().format(constants.dateFormat)
        },
      ],
      links: [],
    };
    this.selectedDataset = this.flow.nodes[0];
    setTimeout(() => {
      this.updateChart();
    }, 100);

    this.updateFlowInDb();
  }

  addDataset(dataset) {
    this.flow.nodes.push({
      id: `${this.flow.nodes.length + 1}`,
      label: `Rule ${this.flow.nodes.length + 1}`,
      actions:[],
      checks: [],
      updated: moment().format(constants.dateFormat)
    });

    this.flow.links.push({
      id: `a${this.flow.nodes.length}`, // id can't start from a digit
      source: `${dataset.id}`,
      target: `${this.flow.nodes.length}`,
      label: `custom label ${this.flow.nodes.length}`,
    });

    this.updateFlowInDb();
    this.updateChart();
  }

  add(transformation) {
    const transformationCopy = JSON.parse(JSON.stringify(transformation));
    if (this.adding === 'action') {
      this.selectedDataset.actions = [
        ...(this.selectedDataset.actions ? this.selectedDataset.actions : []),
        transformationCopy,
      ];
    } else {
      this.selectedDataset.checks = [
        ...(this.selectedDataset.checks ? this.selectedDataset.checks : []),
        transformationCopy,
      ];
    }
    this.updateFlowInDb();
    this.assignCopy();
  }

  updateFlowName(newFlowName) {
    const rules = JSON.parse(localStorage.getItem('rules'));
    let ruleToEdit = rules.find((rule) => rule.name === this.flow.name);
    ruleToEdit.name = newFlowName;
    ruleToEdit.updated = moment().format(constants.dateFormat);
    this.flow.name = newFlowName;
    localStorage.setItem('rules', JSON.stringify(rules));
    this.flowNameEdit = false;
  }

  removeFrom(from, action) {
    const toSearch = from === 'actions' ? this.selectedDataset.actions : this.selectedDataset.checks;
    const index = toSearch.findIndex(
      (_transformation) => action.id === _transformation.id
    );
    toSearch.splice(index, 1);
  }

  updateFlowInDb(showMsg = false) {
    const rules = JSON.parse(localStorage.getItem('rules'));
    let ind = rules.findIndex((rule) => rule.name === this.flow.name);
    rules[ind] = { ...this.flow };
    localStorage.setItem('rules', JSON.stringify(rules));

    if(showMsg) {
      this.showSuccessMsg = true;
      setTimeout(() => {
        this.showSuccessMsg = false;
      }, 1000);
    }
  }

  updateSelectedDatasetUpdateDate() {
    this.selectedDataset.updated = moment().format(constants.dateFormat);
    return true;
  }

  getFormatedDate(date) {
    if (date) {
      return moment(date, constants.dateFormat).fromNow();
    }
    return '-';
  }

  getAvailableTransformationsForDataset() {
    const takenIds = this.adding === 'action' ? [
      ...this.selectedDataset?.actions.map(transformation => transformation.id)
    ] : [
      ...this.selectedDataset?.checks.map(transformation => transformation.id),
    ];

    return this.transformations.filter(
      transformation => !takenIds.includes(transformation.id)
    );
  }

  assignCopy() {
    this.filteredTransformations = Object.assign([], this.getAvailableTransformationsForDataset());
  }

  filterItem(value){
    if(!value){
      this.assignCopy();
    } // when nothing has typed
    this.filteredTransformations = Object.assign([], this.getAvailableTransformationsForDataset()).filter(
      item => item.title.toLowerCase().indexOf(value.toLowerCase()) > -1
    );
  }

  openSearch(action) {
    this.selectedIndex = 1;
    this.adding = action;
    this.assignCopy();
  }

  navigateToHome() {
    this.router.navigate(['']);
  }

  updateChart() {
    this.update$.next(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
