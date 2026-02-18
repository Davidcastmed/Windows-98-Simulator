import { Component, ChangeDetectionStrategy, signal, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppComponentType } from '../../app.component';

interface File {
  type: 'file';
  name: string;
}
interface Directory {
  type: 'directory';
  name: string;
  children: FSNode[];
}
type FSNode = File | Directory;

@Component({
  selector: 'app-my-computer',
  templateUrl: './my-computer.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComputerComponent {
  private sanitizer = inject(DomSanitizer);
  openApp = output<AppComponentType>();

  folderIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>`;
  fileIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6.414A2.2 0 0017.414 5L13 1.586A2 2 0 0011.586 1H4zM12 2v4h4L12 2z" clip-rule="evenodd" /></svg>`;

  private readonly fileSystem: Directory = {
    name: 'C:',
    type: 'directory',
    children: [
      {
        name: 'Program Files',
        type: 'directory',
        children: [
          { name: 'Internet Explorer', type: 'directory', children: [
            { name: 'iexplore.exe', type: 'file' }
          ] },
          { name: 'Windows Media Player', type: 'directory', children: [
            { name: 'wmplayer.exe', type: 'file' }
          ]},
          { name: 'Microsoft Office', type: 'directory', children: [
            { name: 'excel.exe', type: 'file' },
            { name: 'winword.exe', type: 'file' }
          ]},
        ]
      },
      {
        name: 'My Documents',
        type: 'directory',
        children: [
          { 
            name: 'My Pictures', 
            type: 'directory', 
            children: [
              { name: 'vacation.jpg', type: 'file' },
              { name: 'family.png', type: 'file' }
            ] 
          },
          { 
            name: 'My Music', 
            type: 'directory', 
            children: [
              { name: 'favorite_song.mp3', type: 'file' }
            ] 
          },
          { name: 'resume.doc', type: 'file' },
          { name: 'photo.jpg', type: 'file' }
        ]
      },
      {
        name: 'Windows',
        type: 'directory',
        children: [
          { name: 'system32', type: 'directory', children: [] },
          { name: 'notepad.exe', type: 'file' },
          { name: 'win.ini', type: 'file' }
        ]
      },
       {
        name: 'Recycle Bin',
        type: 'directory',
        children: [
          { name: 'deleted_file.txt', type: 'file' }
        ]
      },
      { name: 'autoexec.bat', type: 'file'},
      { name: 'config.sys', type: 'file'}
    ]
  };

  currentPath = signal<string[]>(['C:']);
  
  currentDirectoryContent = computed(() => {
    let current: Directory = this.fileSystem;
    for (let i = 1; i < this.currentPath().length; i++) {
      const segment = this.currentPath()[i];
      const nextDir = current.children.find(node => node.type === 'directory' && node.name === segment) as Directory;
      if (nextDir) {
        current = nextDir;
      } else {
        return this.fileSystem.children;
      }
    }
    return current.children;
  });

  addressPath = computed(() => this.currentPath().join('\\'));

  navigate(folderName: string) {
    this.currentPath.update(p => [...p, folderName]);
  }

  onDoubleClick(item: FSNode) {
    if (item.type === 'directory') {
      this.navigate(item.name);
    } else {
      switch (item.name) {
        case 'notepad.exe':
          this.openApp.emit('notepad');
          break;
        case 'wmplayer.exe':
          this.openApp.emit('audio-player');
          break;
        case 'iexplore.exe':
          this.openApp.emit('internet-explorer');
          break;
      }
    }
  }

  goUp() {
    if (this.currentPath().length > 1) {
      this.currentPath.update(p => p.slice(0, -1));
    }
  }

  getSafeIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}