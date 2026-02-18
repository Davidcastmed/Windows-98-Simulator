import { Component, input, output, ChangeDetectionStrategy, signal, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WindowConfig {
  id: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  active: boolean;
}

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class WindowComponent {
  config = input.required<WindowConfig>();
  
  windowClose = output<void>();
  windowFocus = output<void>();
  windowMinimize = output<void>();

  position = signal({ x: 0, y: 0 });
  isDragging = signal(false);
  
  private dragStartPos = { x: 0, y: 0 };
  private windowStartPos = { x: 0, y: 0 };

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.position.set({ x: this.config().x, y: this.config().y });
  }

  onClose(event: Event) {
    event.stopPropagation();
    this.windowClose.emit();
  }

  onMinimize(event: Event) {
    event.stopPropagation();
    this.windowMinimize.emit();
  }

  onFocus() {
    this.windowFocus.emit();
  }

  startDrag(event: MouseEvent) {
    if (!this.config().active) {
      this.onFocus();
    }
    this.isDragging.set(true);
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = this.position();
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isDragging()) return;
      const dx = moveEvent.clientX - this.dragStartPos.x;
      const dy = moveEvent.clientY - this.dragStartPos.y;
      this.position.set({
        x: this.windowStartPos.x + dx,
        y: this.windowStartPos.y + dy,
      });
    };

    const onMouseUp = () => {
      this.isDragging.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}