import { Injectable } from '@nestjs/common';

@Injectable()
export class UsageService {
  getStats() {
    return {
      dailyResponses: [
        { date: '2025-10-24', responses: 123 },
        { date: '2025-10-25', responses: 456 }
      ],
      responseCodes: [
        { name: '200', value: 800 },
        { name: '3xx', value: 100 },
        { name: '4xx', value: 50 },
        { name: '5xx', value: 20 }
      ]
    };
  }
}