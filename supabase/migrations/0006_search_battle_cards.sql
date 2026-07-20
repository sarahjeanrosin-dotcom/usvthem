-- Filtered + full-text search over a user's battle cards (History page)
create or replace function search_battle_cards(
  user_id_filter           uuid,
  competitor_id_filter     uuid default null,
  decision_maker_filter    text default null,
  vertical_filter          text default null,
  product_category_filter  text default null,
  date_from_filter         timestamptz default null,
  date_to_filter           timestamptz default null,
  keyword_filter           text default null,
  limit_count              int default 20
)
returns table (
  id                uuid,
  decision_maker    text,
  vertical          text,
  product_category  text,
  competitor_ids    uuid[],
  pdf_url           text,
  created_at        timestamptz
)
language sql stable
as $$
  select
    battle_cards.id,
    battle_cards.decision_maker,
    battle_cards.vertical,
    battle_cards.product_category,
    battle_cards.competitor_ids,
    battle_cards.pdf_url,
    battle_cards.created_at
  from public.battle_cards
  where battle_cards.user_id = user_id_filter
    and (competitor_id_filter is null or competitor_id_filter = any(battle_cards.competitor_ids))
    and (decision_maker_filter is null or battle_cards.decision_maker = decision_maker_filter)
    and (vertical_filter is null or battle_cards.vertical = vertical_filter)
    and (product_category_filter is null or battle_cards.product_category = product_category_filter)
    and (date_from_filter is null or battle_cards.created_at >= date_from_filter)
    and (date_to_filter is null or battle_cards.created_at < date_to_filter + interval '1 day')
    and (
      keyword_filter is null
      or to_tsvector('english', battle_cards.generated_content::text)
         @@ websearch_to_tsquery('english', keyword_filter)
      or battle_cards.decision_maker ilike '%' || keyword_filter || '%'
      or battle_cards.vertical ilike '%' || keyword_filter || '%'
      or battle_cards.product_category ilike '%' || keyword_filter || '%'
    )
  order by battle_cards.created_at desc
  limit limit_count;
$$;
