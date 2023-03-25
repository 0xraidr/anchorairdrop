import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Anchorairdrop } from "../target/types/anchorairdrop";
import * as utils from "../test_utils/utils";
import { PublicKey } from "@solana/web3.js";
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";

describe("anchorairdrop", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Anchorairdrop as Program<Anchorairdrop>;
  const provider = utils.getProvider();

  const myKeypair = provider.wallet.payer as anchor.web3.Keypair;

  const recipientWallet: anchor.web3.Keypair = anchor.web3.Keypair.generate();

  const tokenMint = new PublicKey(
    "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
  );

  it("Prep a new test wallet for transfers", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        recipientWallet.publicKey,
        await provider.connection.getMinimumBalanceForRentExemption(0)
      )
    );
    console.log(`Recipient Pubkey: ${recipientWallet.publicKey}`);
  });

  it("Transfer some tokens to another wallet!", async () => {
    const fromAssociatedTokenAccountAddress =
      await anchor.utils.token.associatedAddress({
        mint: tokenMint,
        owner: provider.publicKey,
      });
    const toAssociatedTokenAccountAddress =
      await anchor.utils.token.associatedAddress({
        mint: tokenMint,
        owner: recipientWallet.publicKey,
      });

    const sx = await program.methods
      .transferTokens(new anchor.BN(150))
      .accounts({
        mintAccount: tokenMint,
        fromAssociatedTokenAccount: fromAssociatedTokenAccountAddress,
        owner: provider.publicKey,
        toAssociatedTokenAccount: toAssociatedTokenAccountAddress,
        recipient: recipientWallet.publicKey,
        payer: provider.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([myKeypair])
      .rpc();

    console.log("Success!");
    console.log(`   Mint Address: ${tokenMint}`);
    console.log(`   Tx Signature: ${sx}`);
  });
});
