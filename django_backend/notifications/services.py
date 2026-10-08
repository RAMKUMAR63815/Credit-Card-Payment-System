from django.core.mail import send_mail
from django.conf import settings


def send_email_notification(
    recipient_email,
    subject,
    message,
):
    if not recipient_email:
        return False

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        fail_silently=False,
        # django say If email sending fails,  raise the error
    )

    return True


def send_high_transaction_alert(user, amount): 
                              #  Who?   How much?
    return send_email_notification(
        recipient_email=user.email,
        subject="Credit Card - High Value Transaction Alert",
        message=(
            f"Hello {user.username},\n\n"
            f"A transaction of ₹{amount} was detected "
            f"on your credit card.\n\n"
            "This transaction exceeds ₹5000.\n\n"
            "Please review your transaction history "
            "if you do not recognize this payment."
        ),
    )


def send_card_blocked_alert(user, card):
                          #Who?   Which card?
    return send_email_notification(
        recipient_email=user.email,
        subject="Credit Card - Card Blocked",
        message=(
            f"Hello {user.username},\n\n"
            f"Your card ending in {card.last_four} "
            "has been blocked.\n\n"
            "If you did not request this action, "
            "please contact the administrator."
        ),
    )


def send_low_credit_alert(user, card):
    return send_email_notification(
        recipient_email=user.email,
        subject="Credit Card - Low Available Credit",
        message=(
            f"Hello {user.username},\n\n"
            f"Your available credit for card ending "
            f"in {card.last_four} is below 10% of the "
            "credit limit.\n\n"
            "Please review your card usage."
        ),
    )
def check_low_credit_alert(card):
    # Avoid division by zero
    if card.credit_limit <= 0:
        return
    # Calculate remaining credit percentage
    percentage = ( card.available_credit / card.credit_limit) * 100

    # Send alert when available credit is below 10%
    if percentage < 10:
        send_low_credit_alert(card.user,card )