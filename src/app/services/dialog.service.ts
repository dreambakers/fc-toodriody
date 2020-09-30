import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { CreateFlowComponent } from '../dialogs/create-flow/create-flow.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(
    public dialog: MatDialog,
  ) { }


  createFlow(): Observable<any> {
    const dialogRef = this.dialog.open(CreateFlowComponent, {
      minWidth: '500px'
    });
    return dialogRef.afterClosed();
  }

}
