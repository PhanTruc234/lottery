module lottery::lottery {
    use iota::object;
    use iota::transfer;
    use iota::tx_context;
    public struct Ticket has store {
        number: u16,
    }
    public struct LotteryBox has key, store {
        id: object::UID,
        ticket: Ticket,
        user: address,
    }
    public struct LuckyNumber has key, store {
        id: object::UID,
        number: u16,
    }
    public struct Winner has key, store {
        id: object::UID,
        user: address,
    }
    #[allow(lint(self_transfer))]
    public fun buy_ticket(num: u16, ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);

        transfer::public_transfer(
            LotteryBox {
                id: object::new(ctx),
                ticket: Ticket { number: num },
                user: sender,
            },
            sender,
        );
    }
    #[allow(lint(self_transfer))]
    public fun draw_lucky(ctx: &mut tx_context::TxContext) {
        let id = object::new(ctx);
        let uid_bytes = object::uid_to_bytes(&id);
        let b1 = *vector::borrow(&uid_bytes, 0);
        let b2 = *vector::borrow(&uid_bytes, 1);
        let rnd = ((b1 as u64) << 8) | (b2 as u64);
        let lucky = (rnd % 100) as u16;
        let sender = tx_context::sender(ctx);
        transfer::public_transfer(
            LuckyNumber {
                id,
                number: lucky,
            },
            sender,
        );
    }
    public fun check_winner(
        ticket: &LotteryBox,
        lucky: &LuckyNumber,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        if (ticket.ticket.number != lucky.number) {
            return;
        };
        transfer::public_transfer(
            Winner {
                id: object::new(ctx),
                user: sender,
            },
            sender,
        );
    }
}
