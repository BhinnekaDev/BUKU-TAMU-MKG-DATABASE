import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private anonClient: SupabaseClient;
  private adminClient: SupabaseClient;
  private supabaseUrl: string;
  private anonKey: string;
  private serviceRoleKey: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    this.anonKey = this.configService.get<string>('SUPABASE_KEY')!;
    this.serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    )!;

    if (!this.supabaseUrl || !this.anonKey || !this.serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY must be set',
      );
    }

    this.anonClient = createClient(this.supabaseUrl, this.anonKey);
    this.adminClient = createClient(this.supabaseUrl, this.serviceRoleKey);
  }

  getClient(): SupabaseClient {
    return this.anonClient;
  }

  getClientWithAccessToken(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }
}
