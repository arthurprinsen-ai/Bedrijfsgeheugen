GRANT USAGE ON SCHEMA writer_control TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE writer_control.authority TO service_role;
GRANT EXECUTE ON FUNCTION writer_control.acquire(text,text,text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION writer_control.verify(text,text,bigint,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION writer_control.release(text,text,bigint) TO service_role;
REVOKE ALL ON SCHEMA writer_control FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE writer_control.authority FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA writer_control FROM PUBLIC,anon,authenticated;