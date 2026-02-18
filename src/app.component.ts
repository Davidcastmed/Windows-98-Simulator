import { Component, ChangeDetectionStrategy, signal, computed, WritableSignal, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { WindowComponent, WindowConfig } from './components/window/window.component';
import { NotepadComponent } from './components/notepad/notepad.component';
import { MyComputerComponent } from './components/my-computer/my-computer.component';
import { MinesweeperComponent } from './components/minesweeper/minesweeper.component';
import { AudioPlayerComponent } from './components/audio-player/audio-player.component';
import { InternetExplorerComponent } from './components/internet-explorer/internet-explorer.component';
import { FileExplorerComponent } from './components/file-explorer/file-explorer.component';
import { GeminiService } from './gemini.service'; // Ensure service is available

export type AppComponentType = 'notepad' | 'my-computer' | 'minesweeper' | 'audio-player' | 'internet-explorer' | 'file-explorer';

export interface AppWindow extends WindowConfig {
  id: number;
  component: AppComponentType;
  zIndex: number;
  active: boolean;
  minimized: boolean;
}

export interface DesktopIcon {
  id: AppComponentType;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, WindowComponent, NotepadComponent, MyComputerComponent, MinesweeperComponent, AudioPlayerComponent, InternetExplorerComponent, FileExplorerComponent],
})
export class AppComponent {
  private sanitizer = inject(DomSanitizer);
  
  // Ensure GeminiService is instantiated.
  private geminiService = inject(GeminiService);

  currentTime = signal(new Date());
  startMenuOpen = signal(false);

  desktopIcons: WritableSignal<DesktopIcon[]> = signal([
    { id: 'my-computer', name: 'My Computer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image href="https://win98icons.alexmeub.com/icons/png/computer_explorer-4.png" height="48" width="48"/></svg>` },
    { id: 'file-explorer', name: 'Windows Explorer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image href="https://win98icons.alexmeub.com/icons/png/directory_explorer-4.png" height="48" width="48"/></svg>` },
    { id: 'notepad', name: 'Notepad', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image href="https://win98icons.alexmeub.com/icons/png/notepad-4.png" height="48" width="48"/></svg>` },
    { id: 'minesweeper', name: 'Minesweeper', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image href="https://win98icons.alexmeub.com/icons/png/minesweeper-0.png" height="48" width="48"/></svg>` },
    { id: 'audio-player', name: 'Windows Media Player', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image href="https://win98icons.alexmeub.com/icons/png/windows_media_player-4.png" height="48" width="48"/></svg>` },
    { id: 'internet-explorer', name: 'Internet Explorer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image href="https://win98icons.alexmeub.com/icons/png/msie2-4.png" height="48" width="48"/></svg>`}
  ]);
  
  openWindows: WritableSignal<AppWindow[]> = signal([]);
  private nextId = 0;
  private maxZIndex = 10;

  highestZIndex = computed(() => {
    const windows = this.openWindows();
    if (windows.length === 0) return 10;
    return Math.max(...windows.map(w => w.zIndex));
  });
  
  constructor() {
    afterNextRender(() => {
      setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);
    });
  }

  toggleStartMenu() {
    this.startMenuOpen.update(v => !v);
  }

  closeStartMenu() {
    this.startMenuOpen.set(false);
  }

  openWindow(app: AppComponentType) {
    this.closeStartMenu();
    
    const existingWindow = this.openWindows().find(w => w.component === app);
    if(existingWindow) {
      this.focusWindow(existingWindow.id);
      return;
    }

    this.maxZIndex++;
    let newWindow: AppWindow;
    const common = {
      id: this.nextId++,
      component: app,
      x: 50 + (this.openWindows().length % 10) * 20,
      y: 50 + (this.openWindows().length % 10) * 20,
      zIndex: this.maxZIndex,
      active: true,
      minimized: false,
    };

    switch (app) {
      case 'notepad':
        newWindow = { ...common, title: 'Untitled - Notepad', width: 400, height: 300 };
        break;
      case 'my-computer':
        newWindow = { ...common, title: 'My Computer', width: 550, height: 400 };
        break;
      case 'minesweeper':
        newWindow = { ...common, title: 'Minesweeper', width: 250, height: 320 };
        break;
      case 'audio-player':
        newWindow = { ...common, title: 'Windows Media Player', width: 320, height: 400 };
        break;
      case 'internet-explorer':
        newWindow = { ...common, title: 'Internet Explorer', width: 640, height: 480 };
        break;
      case 'file-explorer':
        newWindow = { ...common, title: 'Exploring - My Documents', width: 550, height: 400 };
        break;
      default:
        return;
    }

    this.openWindows.update(windows => {
        const deactivatedWindows = windows.map(w => ({...w, active: false}));
        return [...deactivatedWindows, newWindow];
    });
  }

  closeWindow(id: number) {
    this.openWindows.update(windows => windows.filter(w => w.id !== id));
  }

  focusWindow(id: number) {
    this.maxZIndex++;
    this.openWindows.update(windows => 
      windows.map(w => ({
        ...w,
        active: w.id === id,
        zIndex: w.id === id ? this.maxZIndex : w.zIndex,
      }))
    );
  }

  minimizeWindow(id: number) {
    let wasActive = false;
    this.openWindows.update(windows => 
        windows.map(w => {
            if (w.id === id) {
                wasActive = w.active;
                return { ...w, minimized: true, active: false };
            }
            return w;
        })
    );

    if (wasActive) {
        const nextWindowToActivate = this.openWindows()
            .filter(w => !w.minimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0];
        if (nextWindowToActivate) {
            this.focusWindow(nextWindowToActivate.id);
        }
    }
  }

  onTaskbarClick(id: number) {
    const targetWindow = this.openWindows().find(w => w.id === id);
    if (!targetWindow) return;

    if (targetWindow.active && !targetWindow.minimized) {
      this.minimizeWindow(id);
    } else {
      // Un-minimize and focus
      this.maxZIndex++;
      this.openWindows.update(windows =>
        windows.map(w => ({
          ...w,
          minimized: w.id === id ? false : w.minimized,
          active: w.id === id,
          zIndex: w.id === id ? this.maxZIndex : w.zIndex,
        }))
      );
    }
  }

  updateWindowTitle({ id, title }: { id: number, title: string }) {
    this.openWindows.update(windows => 
      windows.map(w => w.id === id ? { ...w, title } : w)
    );
  }

  getSafeIconHtml(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}