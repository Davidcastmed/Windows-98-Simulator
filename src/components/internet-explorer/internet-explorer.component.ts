import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GeminiService } from '../../gemini.service';
import type { GroundingChunk } from '@google/genai';

@Component({
  selector: 'app-internet-explorer',
  templateUrl: './internet-explorer.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetExplorerComponent implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private geminiService = inject(GeminiService);

  isLoading = signal(false);

  private readonly homePageContent = `
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #FFFFFF;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        margin: 0;
        text-align: center;
      }
      .container {
        margin-top: -50px;
      }
      img.logo {
        width: 275px;
        height: 95px;
        margin-bottom: 20px;
      }
      .search-box {
        width: 400px;
        padding: 8px;
        border: 1px solid #ccc;
        font-size: 16px;
        margin: 0 auto;
      }
      .buttons {
        margin-top: 20px;
      }
      .buttons button {
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        font-size: 14px;
        padding: 6px 12px;
        margin: 0 5px;
        cursor: pointer;
      }
    </style>
    <div class="container">
      <img src="https://web.archive.org/web/19991127145423im_/http://www.google.com/google.jpg" alt="Google Logo (1999)" class="logo">
      <form id="search-form">
        <div style="margin-bottom: 20px;">
          <p style="font-size:12px; margin-bottom: 5px;">Search the web using Google</p>
          <input type="text" class="search-box" name="q" autofocus>
        </div>
        <div class="buttons">
          <button type="submit">Google Search</button>
          <button type="submit" name="btnI" value="1">I'm Feeling Lucky</button>
        </div>
      </form>
    </div>
    <script>
      document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const query = e.target.elements.q.value;
        if (query) {
          window.parent.postMessage({ type: 'ie-search', query }, '*');
        }
      });
    </script>
  `;

  iframeSrc = signal<SafeResourceUrl>('about:blank');
  addressBarUrl = signal('about:home');

  constructor() {
    this.handleIframeMessage = this.handleIframeMessage.bind(this);
    afterNextRender(() => {
      window.addEventListener('message', this.handleIframeMessage);
    });
  }

  ngOnInit() {
    this.navigateToUrl('about:home');
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
  }

  private handleIframeMessage(event: MessageEvent) {
    if (event.data) {
      if (event.data.type === 'ie-search') {
        this.navigateToUrl(event.data.query);
      } else if (event.data.type === 'ie-navigate') {
        this.navigateToUrl(event.data.url);
      }
    }
  }

  async navigateToUrl(url: string) {
    this.addressBarUrl.set(url);
    if (url === 'about:home' || url.trim() === '') {
      const dataUrl = `data:text/html,${encodeURIComponent(this.homePageContent)}`;
      this.iframeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl));
      return;
    }

    const isLikelyUrl = url.includes('.') || url.startsWith('http://') || url.startsWith('https://') || url.includes('/') || url.toLowerCase().includes('localhost');

    if (isLikelyUrl) {
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }
      this.iframeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl));
    } else {
      this.isLoading.set(true);
      this.iframeSrc.set(this._renderLoadingPage(url));
      try {
        const response = await this.geminiService.search(url);
        const summary = response.text();
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        this.iframeSrc.set(this._renderSearchResultsPage(url, summary, sources as GroundingChunk[]));
      } catch (error) {
        console.error(error);
        this.iframeSrc.set(this._renderErrorPage(url));
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  handleAddressBar(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const inputElement = event.target as HTMLInputElement;
      this.navigateToUrl(inputElement.value);
    }
  }

  private _renderLoadingPage(query: string): SafeResourceUrl {
    const html = `
      <style>body{font-family:'VT323',monospace;display:flex;justify-content:center;align-items:center;height:100%;color:#555;}</style>
      <body><h1>Searching for "${query}"...</h1></body>`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`data:text/html,${encodeURIComponent(html)}`);
  }

  private _renderErrorPage(query: string): SafeResourceUrl {
    const html = `
      <style>body{font-family:'VT323',monospace;padding:20px;color:#333;}</style>
      <body>
        <h2>Search Error</h2>
        <p>An error occurred while searching for "${query}".</p>
        <p>This could be due to a network issue or an API configuration problem. Please check the console for details.</p>
      </body>`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`data:text/html,${encodeURIComponent(html)}`);
  }

  private _renderSearchResultsPage(query: string, summary: string, sources: GroundingChunk[]): SafeResourceUrl {
    const sourcesHtml = sources.map(source => {
      if (source.web) {
        return `<div class="result">
            <a class="result-title" href="#" onclick="window.parent.postMessage({ type: 'ie-navigate', url: '${source.web.uri}' }, '*')">${source.web.title}</a>
            <div class="result-url">${source.web.uri}</div>
          </div>`;
      }
      return '';
    }).join('');

    const html = `
      <style>
        body { font-family: 'VT323', monospace; background: #fff; padding: 10px; font-size: 16px; }
        a { color: #0000FF; }
        .header { display: flex; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;}
        .logo { width: 150px; margin-right: 20px;}
        .search-box { border: 1px solid #000; padding: 5px; width: 300px; font-family: 'VT323', monospace; font-size: 16px; }
        .summary { border: 1px dotted #999; padding: 10px; background: #f5f5f5; margin: 20px 0; }
        .result { margin-bottom: 15px; }
        .result-title { font-size: 1.2em; }
        .result-url { color: #008000; font-size: 0.9em;}
      </style>
      <body>
        <div class="header">
           <img src="https://web.archive.org/web/19991127145423im_/http://www.google.com/google.jpg" alt="Google Logo (1999)" class="logo">
           <input type="text" class="search-box" value="${query}" disabled>
        </div>
        
        ${summary ? `<div class="summary">
          <h2>AI Summary</h2>
          <p>${summary.replace(/\\n/g, '<br>')}</p>
        </div>` : ''}
        
        <h2>Web Results</h2>
        <div>
          ${sourcesHtml || '<p>No web results found.</p>'}
        </div>
      </body>
    `;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`data:text/html,${encodeURIComponent(html)}`);
  }
}