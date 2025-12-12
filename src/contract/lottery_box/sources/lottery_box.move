module lottery::lottery {
    use iota::object;
    use iota::transfer;
    use iota::event;
    use iota::tx_context;
    use std::vector;
    public struct LuckyEvent has copy, store, drop {
        value: u16
    }

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
    public entry fun buy_ticket(num: u16, ctx: &mut tx_context::TxContext) {
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
    public entry fun draw_lucky(ctx: &mut tx_context::TxContext) {
        let uid = object::new(ctx);
        let bytes = object::uid_to_bytes(&uid);

        let b1 = *vector::borrow(&bytes, 0);
        let b2 = *vector::borrow(&bytes, 1);

        let rnd = ((b1 as u64) << 8) | (b2 as u64);
        let lucky = (rnd % 100) as u16;
        event::emit<LuckyEvent>(LuckyEvent { value: lucky });

        let sender = tx_context::sender(ctx);

        transfer::public_transfer(
            LuckyNumber {
                id: uid,
                number: lucky,
            },
            sender,
        );
    }
    public entry fun check_winner(
        ticket: LotteryBox,
        lucky: LuckyNumber,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        if (ticket.ticket.number == lucky.number) {
            transfer::public_transfer(
                Winner {
                    id: object::new(ctx),
                    user: sender,
                },
                sender,
            );
        };

        transfer::public_transfer(ticket, sender);
        transfer::public_transfer(lucky, sender);
    }
}
