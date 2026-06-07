from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

BALANCE = {}

class OperationRequest(BaseModel):
	wallet_name: str
	amount: float
	description: str | None = None

@app.get("/balance")
def get_balance(wallet_name: str | None = None): 
    if wallet_name is None:
        return {"total_balance": sum(BALANCE.values())}
    
    if wallet_name not in BALANCE:
        raise HTTPException(
            status_code=404,
            detail=f"Wallet '{wallet_name}' not found"
        )
    
    return {"wallet": wallet_name, "balance": BALANCE[wallet_name]}

@app.post("/wallets/{name}")
def create_wallet(name: str, initial_balance: float = 0):
	if name in BALANCE:
		raise HTTPException(
			status_code=400,
			detail=f"Wallet '{name}' already exists"
		)
	BALANCE[name] = initial_balance
	return {
		"message": f"Wallet '{name}' created",
		"wallet": name,
		"balance": BALANCE[name]
	}
	
@app.post("/operations/income")
def add_income(operation: OperationRequest):
	if operation.wallet_name not in BALANCE:
		raise HTTPException(
			status_code=404,
			detail=f"Wallet '{operation.wallet_name}' not found"
		)
	if operation.amount <= 0:
		raise HTTPException(
			status_code=400,
			detail="Amount must be positive"
		)
	BALANCE[operation.wallet_name] += operation.amount
	return {
		"message": "Income added",
		"wallet": operation.wallet_name,
		"amount": operation.amount,
		"description": operation.description,
		"new_ballance": BALANCE[operation.wallet_name],
		"wallet_ouner" : "Deonisiy"
	}		
	
@app.post("/operations/expense")
def add_expence(operation: OperationRequest):
	if operation.wallet_name not in BALANCE:
		raise HTTPException(
			status_code=404,
			detail=f"Wallet '{operation.wallet_name}' not found"
		)
	if operation.amount <= 0:
		raise HTTPException(
			status_code=400,
			detail="Amount must be positive"
		)
	if BALANCE[operation.wallet_name] < operation.amount:
		raise HTTPException(
			status_code=400,
			detail=f"Insufficent funds. Available: {BALANCE[operation.wallet_name]}"
		)
	BALANCE[operation.wallet_name] -= operation.amount
	return {
		"message": "Expence added",
		"wallet": operation.wallet_name,
		"amount": operation.amount,
		"description": operation.description,
		"new_ballance": BALANCE[operation.wallet_name],
		"wallet_ouner" : "Deonisiy"
	}
	