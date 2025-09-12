const BaseAuthStrategy = require('whatsapp-web.js/src/authStrategies/BaseAuthStrategy');
const { supabase } = require('../supabaseClient.js');

const ConcreteBaseAuthStrategy = BaseAuthStrategy.default || BaseAuthStrategy;

class SupabaseAuth extends ConcreteBaseAuthStrategy {
    constructor(sessionId) {
        super();
        this.sessionId = sessionId;
    }

    async authenticate() {
        const { data, error } = await supabase
            .from('sessions')
            .select('session_data')
            .eq('id', this.sessionId)
            .single();

        if (error || !data) {
            console.log(`[${this.sessionId}] Nenhuma sessão encontrada no Supabase.`);
            return null;
        }
        
        console.log(`[${this.sessionId}] Sessão restaurada do Supabase.`);
        return data.session_data;
    }

    async afterAuth(session) {
        if (session) {
            const { error } = await supabase
                .from('sessions')
                .upsert({ id: this.sessionId, session_data: session }, { onConflict: 'id' });

            if (error) {
                console.error(`[${this.sessionId}] Erro ao salvar sessão no Supabase:`, error);
            } else {
                console.log(`[${this.sessionId}] Sessão salva no Supabase.`);
            }
        }
    }
    
    async logout() {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', this.sessionId);

        if (error) {
            console.error(`[${this.sessionId}] Erro ao deletar sessão do Supabase:`, error);
        } else {
            console.log(`[${this.sessionId}] Sessão deletada do Supabase.`);
        }
    }
}

module.exports = SupabaseAuth;
