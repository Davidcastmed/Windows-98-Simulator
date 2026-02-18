import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenerativeAI;

  constructor() {
    // La clave API se obtiene de las variables de entorno, según las directrices.
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenerativeAI({ apiKey: process.env.API_KEY });
  }

  async search(query: string): Promise<GenerateContentResponse> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: query }] }],
        tools: [{googleSearch: {}}],
      });
      
      return result.response;
    } catch (error) {
      console.error('Error en la búsqueda con la API de Gemini:', error);
      throw error;
    }
  }
}
