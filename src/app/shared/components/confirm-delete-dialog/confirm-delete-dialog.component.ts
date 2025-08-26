// src/app/shared/components/confirm-delete-dialog/confirm-delete-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDeleteData {
  title: string;
  message: string;
  warning?: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p class="message">{{ data.message }}</p>
        <p class="warning" *ngIf="data.warning">
          <mat-icon>info</mat-icon>
          {{ data.warning }}
        </p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button
          mat-button
          (click)="onCancel()"
          class="cancel-button">
          {{ data.cancelText }}
        </button>
        
        <button
          mat-raised-button
          color="warn"
          (click)="onConfirm()"
          class="confirm-button">
          <mat-icon>delete</mat-icon>
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        
        .warning-icon {
          color: var(--warn-color);
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
        
        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
        }
      }
      
      .dialog-content {
        .message {
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          background-color: var(--warn-background);
          border-radius: 4px;
          color: var(--warn-text);
          font-size: 14px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            margin-top: 2px;
          }
        }
      }
      
      .dialog-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        
        .confirm-button {
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    }
  `]
})
export class ConfirmDeleteDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
