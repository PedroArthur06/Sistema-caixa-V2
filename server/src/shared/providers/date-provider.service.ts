import { Injectable } from '@nestjs/common';

@Injectable()
export class DateProvider {
  private readonly TIMEZONE_OFFSET = -4; // UTC-04:00 (Horário de Brasília/Amazonas)

  /**
   * Retorna a data de hoje (00:00:00) no timezone -04:00
   */
  today(): Date {
    const now = new Date();
    
    // Converte para o timezone -04:00
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (this.TIMEZONE_OFFSET * 3600000));
    
    // Zera as horas
    targetTime.setHours(0, 0, 0, 0);
    
    return targetTime;
  }

  /**
   * Retorna o timestamp atual no timezone -04:00
   */
  now(): Date {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (this.TIMEZONE_OFFSET * 3600000));
  }

  /**
   * Converte qualquer data para o timezone -04:00
   */
  parseToTimezone(date: Date): Date {
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utcTime + (this.TIMEZONE_OFFSET * 3600000));
  }

  /**
   * Retorna a data de hoje como string ISO (YYYY-MM-DD)
   */
  todayISO(): string {
    const today = this.today();
    return today.toISOString().split('T')[0];
  }
}
