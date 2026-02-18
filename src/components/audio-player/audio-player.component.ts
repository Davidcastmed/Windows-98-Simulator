import { Component, ChangeDetectionStrategy, signal, viewChild, ElementRef, computed, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Track {
  title: string;
  artist: string;
  url: string;
}

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AudioPlayerComponent {
  audioPlayer = viewChild.required<ElementRef<HTMLAudioElement>>('audioPlayer');

  playlist: Track[] = [
    { title: 'Metal', artist: 'AlexiAction', url: 'https://cdn.pixabay.com/audio/2022/07/16/audio_485a864c88.mp3' },
    { title: 'The Dead Falling', artist: 'Punch Deck', url: 'https://cdn.pixabay.com/audio/2023/04/18/audio_8487311753.mp3' },
    { title: 'Let\'s Go', artist: 'AlexiAction', url: 'https://cdn.pixabay.com/audio/2022/10/24/audio_35b6b7a541.mp3' },
  ];

  currentTrackIndex = signal(0);
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(1);

  currentTrack = computed(() => this.playlist[this.currentTrackIndex()]);

  constructor() {
    afterNextRender(() => {
      const audio = this.audioPlayer().nativeElement;
      audio.addEventListener('play', () => this.isPlaying.set(true));
      audio.addEventListener('pause', () => this.isPlaying.set(false));
      audio.addEventListener('ended', () => this.nextTrack());
      audio.addEventListener('timeupdate', () => this.currentTime.set(audio.currentTime));
      audio.addEventListener('durationchange', () => this.duration.set(audio.duration));
      audio.addEventListener('volumechange', () => this.volume.set(audio.volume));
    });
  }

  playTrack(index: number) {
    this.currentTrackIndex.set(index);
    const audio = this.audioPlayer().nativeElement;
    audio.src = this.currentTrack().url;
    audio.play();
  }

  togglePlayPause() {
    const audio = this.audioPlayer().nativeElement;
    if (this.isPlaying()) {
      audio.pause();
    } else {
      if (!audio.src) {
        this.playTrack(this.currentTrackIndex());
      } else {
        audio.play();
      }
    }
  }
  
  stop() {
    const audio = this.audioPlayer().nativeElement;
    audio.pause();
    audio.currentTime = 0;
  }

  prevTrack() {
    const newIndex = (this.currentTrackIndex() - 1 + this.playlist.length) % this.playlist.length;
    this.playTrack(newIndex);
  }

  nextTrack() {
    const newIndex = (this.currentTrackIndex() + 1) % this.playlist.length;
    this.playTrack(newIndex);
  }

  seek(event: Event) {
    const audio = this.audioPlayer().nativeElement;
    audio.currentTime = parseFloat((event.target as HTMLInputElement).value);
  }

  setVolume(event: Event) {
    const audio = this.audioPlayer().nativeElement;
    audio.volume = parseFloat((event.target as HTMLInputElement).value);
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}