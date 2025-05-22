import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>API Buku Tamu</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center h-screen">
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-4 text-blue-600">API Buku Tamu mkg</h1>
          <a href="/api" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Pergi ke /api
          </a>
        </div>
      </body>
      </html>
    `;
  }
}
