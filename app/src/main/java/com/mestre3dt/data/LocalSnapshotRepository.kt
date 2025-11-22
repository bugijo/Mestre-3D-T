package com.mestre3dt.data

import android.content.Context
import androidx.room.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString

@Entity(tableName = "snapshots")
data class SnapshotEntity(
    @PrimaryKey val id: Int = 0,
    val payload: String,
    val updatedAt: Long
)

@Dao
interface SnapshotDao {
    @Query("SELECT * FROM snapshots WHERE id = 0 LIMIT 1")
    suspend fun getLatest(): SnapshotEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: SnapshotEntity)
}

class SnapshotConverters {
    private val json = Json { encodeDefaults = true }

    @TypeConverter
    fun fromSnapshot(snapshot: RemoteSnapshot): String = json.encodeToString(snapshot)

    @TypeConverter
    fun toSnapshot(value: String): RemoteSnapshot = json.decodeFromString(value)
}

@Database(entities = [SnapshotEntity::class], version = 1, exportSchema = false)
@TypeConverters(SnapshotConverters::class)
abstract class MestreDatabase : RoomDatabase() {
    abstract fun snapshotDao(): SnapshotDao
}

class LocalSnapshotRepository(context: Context) {
    private val db = Room.databaseBuilder(
        context.applicationContext,
        MestreDatabase::class.java,
        "mestre_snapshots.db"
    ).build()

    private val converters = SnapshotConverters()

    suspend fun loadSnapshot(): RemoteSnapshot? =
        db.snapshotDao().getLatest()?.let { converters.toSnapshot(it.payload) }

    suspend fun saveSnapshot(snapshot: RemoteSnapshot) {
        db.snapshotDao().upsert(
            SnapshotEntity(
                payload = converters.fromSnapshot(snapshot),
                updatedAt = System.currentTimeMillis()
            )
        )
    }
}
