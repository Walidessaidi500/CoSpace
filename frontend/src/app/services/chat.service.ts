import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';

// ========================
// INTERFACES
// ========================

export interface ChatUsuario {
    id_usuario: number;
    nombre_completo: string;
    foto_perfil: string | null;
}

export interface ChatMensaje {
    id_mensaje: number;
    contenido: string;
    es_mio: boolean;
    emisor: {
        id_usuario: number;
        nombre_completo: string;
    };
    leido: boolean;
    created_at: string;
}

export interface ChatConversacion {
    id_conv: number;
    otro_usuario: ChatUsuario;
    ultimo_mensaje: {
        contenido: string;
        created_at: string;
        es_mio: boolean;
    } | null;
    no_leidos: number;
    created_at: string;
    updated_at: string;
}

// ========================
// SERVICIO DE CHAT (API REAL)
// ========================

@Injectable({
    providedIn: 'root'
})
export class ChatService {

    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Estado reactivo
    private conversationsSubject = new BehaviorSubject<ChatConversacion[]>([]);
    conversations$ = this.conversationsSubject.asObservable();

    // Control del widget de chat
    private isChatOpenSubject = new BehaviorSubject<boolean>(false);
    isChatOpen$ = this.isChatOpenSubject.asObservable();

    // Conversación activa (ID)
    private activeConversationIdSubject = new BehaviorSubject<number | null>(null);
    activeConversationId$ = this.activeConversationIdSubject.asObservable();

    // Mensajes de la conversación activa
    private messagesSubject = new BehaviorSubject<ChatMensaje[]>([]);
    messages$ = this.messagesSubject.asObservable();

    // Contador total de mensajes no leídos
    private unreadCountSubject = new BehaviorSubject<number>(0);
    unreadCount$ = this.unreadCountSubject.asObservable();

    // Polling interval
    private pollingInterval: any = null;
    private messagePollingInterval: any = null;

    // ========================
    // CARGAR CONVERSACIONES
    // ========================

    /**
     * Cargar todas las conversaciones del usuario autenticado.
     */
    loadConversations(): void {
        this.http.get<ChatConversacion[]>(`${this.apiUrl}/conversaciones`).pipe(
            catchError(err => {
                console.error('ChatService: Error loading conversations', err);
                return of([]);
            })
        ).subscribe(convs => {
            this.conversationsSubject.next(convs);
            this.updateUnreadFromConversations(convs);
        });
    }

    /**
     * Iniciar polling para actualizar conversaciones periódicamente.
     */
    startPolling(): void {
        this.stopPolling();
        // Cargar conversaciones inmediatamente
        this.loadConversations();
        // Polling cada 5 segundos
        this.pollingInterval = setInterval(() => {
            this.loadConversations();
        }, 5000);
    }

    /**
     * Detener polling.
     */
    stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.stopMessagePolling();
    }

    // ========================
    // CREAR / ENCONTRAR CONVERSACIÓN
    // ========================

    /**
     * Iniciar o abrir una conversación con otro usuario.
     */
    startConversation(idUsuarioDestino: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/conversaciones`, {
            id_usuario_destino: idUsuarioDestino
        }).pipe(
            tap(res => {
                // Recargar conversaciones
                this.loadConversations();
                // Abrir el chat con esta conversación
                this.setActiveConversation(res.id_conv);
                this.openChat();
            })
        );
    }

    // ========================
    // MENSAJES
    // ========================

    /**
     * Cargar mensajes de una conversación.
     */
    loadMessages(idConv: number): void {
        this.http.get<ChatMensaje[]>(`${this.apiUrl}/conversaciones/${idConv}/mensajes`).pipe(
            catchError(err => {
                console.error('ChatService: Error loading messages', err);
                return of([]);
            })
        ).subscribe(msgs => {
            this.messagesSubject.next(msgs);
            // También recargar conversaciones para actualizar el contador de no leídos
            this.loadConversations();
        });
    }

    /**
     * Enviar un mensaje en una conversación.
     */
    sendMessage(idConv: number, contenido: string): Observable<ChatMensaje> {
        return this.http.post<ChatMensaje>(`${this.apiUrl}/conversaciones/${idConv}/mensajes`, {
            contenido
        }).pipe(
            tap(msg => {
                // Añadir el mensaje al array actual
                const current = this.messagesSubject.value;
                this.messagesSubject.next([...current, msg]);
                // Recargar conversaciones para actualizar último mensaje
                this.loadConversations();
            })
        );
    }

    /**
     * Iniciar polling de mensajes para la conversación activa.
     */
    startMessagePolling(idConv: number): void {
        this.stopMessagePolling();
        // Cargar inmediatamente
        this.loadMessages(idConv);
        // Polling cada 3 segundos
        this.messagePollingInterval = setInterval(() => {
            this.loadMessages(idConv);
        }, 3000);
    }

    /**
     * Detener polling de mensajes.
     */
    stopMessagePolling(): void {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }

    // ========================
    // MENSAJES NO LEÍDOS
    // ========================

    /**
     * Obtener total de no leídos desde la API.
     */
    loadUnreadCount(): void {
        this.http.get<{ total: number }>(`${this.apiUrl}/conversaciones/no-leidos`).pipe(
            catchError(() => of({ total: 0 }))
        ).subscribe(res => {
            this.unreadCountSubject.next(res.total);
        });
    }

    private updateUnreadFromConversations(convs: ChatConversacion[]): void {
        const total = convs.reduce((sum, c) => sum + c.no_leidos, 0);
        this.unreadCountSubject.next(total);
    }

    // ========================
    // CONTROL DEL WIDGET UI
    // ========================

    openChat(): void {
        this.isChatOpenSubject.next(true);
    }

    closeChat(): void {
        this.isChatOpenSubject.next(false);
    }

    toggleChat(): void {
        this.isChatOpenSubject.next(!this.isChatOpenSubject.value);
    }

    setActiveConversation(idConv: number | null): void {
        this.activeConversationIdSubject.next(idConv);
        if (idConv) {
            this.startMessagePolling(idConv);
        } else {
            this.stopMessagePolling();
            this.messagesSubject.next([]);
        }
    }

    getActiveConversationId(): number | null {
        return this.activeConversationIdSubject.value;
    }

    getConversations(): ChatConversacion[] {
        return this.conversationsSubject.value;
    }

    hasConversations(): boolean {
        return this.conversationsSubject.value.length > 0;
    }
}
