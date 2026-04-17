import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type Payload = { clientId?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const clientId = body.clientId ?? '';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 });

    const admin = createAdminClient();
    const { data: client } = await admin.from('clients').select('user_id').eq('user_id', clientId).eq('nutritionist_user_id', user.id).maybeSingle();
    if (!client) return NextResponse.json({ success: false, message: 'Cliente no válido.' }, { status: 404 });

    const { error } = await admin.from('measurement_requests').insert({ client_user_id: clientId, nutritionist_user_id: user.id });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Solicitud enviada.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'No se pudo enviar la solicitud.' }, { status: 500 });
  }
}
