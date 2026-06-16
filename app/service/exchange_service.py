from decimal import Decimal
from typing import Dict, Tuple

from app.enum import CurrencyEnum

FALLBACK_RATES: Dict[Tuple[str,str], Decimal] = {
    (CurrencyEnum.USD, CurrencyEnum.RUB): Decimal(str(95.0)),
    (CurrencyEnum.USD, CurrencyEnum.EUR): Decimal(str(0.92)),
    (CurrencyEnum.EUR, CurrencyEnum.RUB): Decimal(str(103.26)),
    (CurrencyEnum.RUB, CurrencyEnum.USD): Decimal(str(0.0105)),
    (CurrencyEnum.EUR, CurrencyEnum.USD): Decimal(str(1.087)),
    (CurrencyEnum.RUB, CurrencyEnum.EUR): Decimal(str(0.0097)),
}

def get_exchange_rate(base: CurrencyEnum, target: CurrencyEnum) -> Decimal:
    return FALLBACK_RATES.get((base,target), Decimal(1))