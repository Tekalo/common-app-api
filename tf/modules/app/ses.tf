resource "aws_ses_domain_identity" "tekalo_io" {
  domain = "${var.env}.tekalo.io"
}

resource "aws_route53_record" "tekalo_io_verification_record" {
  zone_id = data.aws_route53_zone.main
  name    = "_amazonses.${aws_ses_domain_identity.tekalo_io.id}"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.tekalo_io.verification_token]
}
