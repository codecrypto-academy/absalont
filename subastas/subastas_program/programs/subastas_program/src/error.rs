use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The auction is not active.")]
    AuctionNotActive,
    #[msg("The auction has ended.")]
    AuctionEnded,
    #[msg("Bid amount is too low.")]
    BidTooLow,
    #[msg("The auction has not ended yet.")]
    AuctionNotEnded,
    #[msg("Invalid previous bidder for refund.")]
    InvalidPreviousBidder,
}
