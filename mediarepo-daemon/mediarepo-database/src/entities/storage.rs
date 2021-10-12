use sea_orm::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "storage_locations")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub name: String,
    pub path: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::file::Entity")]
    File,
    #[sea_orm(has_many = "super::thumbnail::Entity")]
    Thumbnail,
}

impl Related<super::file::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::File.def()
    }
}

impl Related<super::thumbnail::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Thumbnail.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
