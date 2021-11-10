from brownie import accounts

def main():
    accounts[0].transfer(accounts[-1], '1 ether')
